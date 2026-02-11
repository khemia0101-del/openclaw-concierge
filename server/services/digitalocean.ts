import axios from 'axios';

const DO_API_TOKEN = process.env.DO_API_TOKEN || '';
const DO_API_BASE = 'https://api.digitalocean.com/v2';

export interface CreateAppParams {
  userId: number;
  userEmail: string;
  aiRole: string;
  tier: 'starter' | 'pro' | 'business';
  telegramBotToken?: string;
  config: Record<string, any>;
}

export interface AppSpec {
  name: string;
  region: string;
  services: Array<{
    name: string;
    image: {
      registry_type: string;
      repository: string;
      tag: string;
    };
    instance_count: number;
    instance_size_slug: string;
    envs: Array<{
      key: string;
      value: string;
      scope: string;
    }>;
    http_port: number;
  }>;
}

/**
 * Create a DigitalOcean App Platform application for OpenClaw
 */
export async function createOpenClawApp(params: CreateAppParams): Promise<any> {
  const { userId, userEmail, aiRole, tier, telegramBotToken, config } = params;

  // Determine instance size based on tier
  // Valid slugs: basic-xxs, basic-xs, basic-s, basic-m, basic-l
  const instanceSizes = {
    starter: 'basic-xxs',
    pro: 'basic-xs',
    business: 'basic-s',
  };

  const appSpec: AppSpec = {
    name: `openclaw-${userId}-${Date.now()}`,
    region: 'nyc',
    services: [
      {
        name: 'openclaw-instance',
        image: {
          registry_type: 'DOCKER_HUB',
          repository: 'alpine/openclaw',
          tag: 'latest',
        },
        instance_count: 1,
        instance_size_slug: instanceSizes[tier],
        envs: [
          {
            key: 'USER_ID',
            value: userId.toString(),
            scope: 'RUN_TIME',
          },
          {
            key: 'USER_EMAIL',
            value: userEmail,
            scope: 'RUN_TIME',
          },
          {
            key: 'AI_ROLE',
            value: aiRole,
            scope: 'RUN_TIME',
          },
          {
            key: 'TELEGRAM_BOT_TOKEN',
            value: telegramBotToken || '',
            scope: 'RUN_TIME',
          },
          {
            key: 'CONFIG_JSON',
            value: JSON.stringify(config),
            scope: 'RUN_TIME',
          },
        ],
        http_port: 8080,
      },
    ],
  };

  if (!DO_API_TOKEN) {
    console.error('[DigitalOcean] DO_API_TOKEN is not set — cannot provision apps');
    throw new Error('DigitalOcean API token is not configured. Please set DO_API_TOKEN.');
  }

  try {
    const response = await axios.post(
      `${DO_API_BASE}/apps`,
      { spec: appSpec },
      {
        headers: {
          'Authorization': `Bearer ${DO_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30s — fail fast if DO API is unreachable
      }
    );

    return response.data.app;
  } catch (error: any) {
    const doError = error.response?.data || error.message;
    const statusCode = error.response?.status;
    console.error('[DigitalOcean] Failed to create app:', JSON.stringify({
      status: statusCode,
      error: doError,
      appName: appSpec.name,
      region: appSpec.region,
      instanceSize: instanceSizes[tier],
    }));
    throw new Error(`Failed to provision AI instance: ${typeof doError === 'object' ? JSON.stringify(doError) : doError}`);
  }
}

/**
 * Get app details by ID
 */
export async function getApp(appId: string): Promise<any> {
  try {
    const response = await axios.get(`${DO_API_BASE}/apps/${appId}`, {
      headers: {
        'Authorization': `Bearer ${DO_API_TOKEN}`,
      },
    });

    return response.data.app;
  } catch (error: any) {
    console.error('[DigitalOcean] Failed to get app:', error.response?.data || error.message);
    throw new Error('Failed to retrieve app details');
  }
}

/**
 * Get app deployment status
 */
export async function getDeploymentStatus(appId: string): Promise<string> {
  try {
    const app = await getApp(appId);
    return app.active_deployment?.phase || 'unknown';
  } catch (error) {
    return 'error';
  }
}

/**
 * Delete an app
 */
export async function deleteApp(appId: string): Promise<void> {
  try {
    await axios.delete(`${DO_API_BASE}/apps/${appId}`, {
      headers: {
        'Authorization': `Bearer ${DO_API_TOKEN}`,
      },
    });
  } catch (error: any) {
    console.error('[DigitalOcean] Failed to delete app:', error.response?.data || error.message);
    throw new Error('Failed to delete app');
  }
}

/**
 * Restart an app
 */
export async function restartApp(appId: string): Promise<void> {
  try {
    await axios.post(
      `${DO_API_BASE}/apps/${appId}/deployments`,
      { force_build: false },
      {
        headers: {
          'Authorization': `Bearer ${DO_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[DigitalOcean] Failed to restart app:', error.response?.data || error.message);
    throw new Error('Failed to restart app');
  }
}

/**
 * Get app logs
 */
export async function getAppLogs(appId: string, componentName: string = 'openclaw-instance'): Promise<string[]> {
  try {
    const response = await axios.get(
      `${DO_API_BASE}/apps/${appId}/components/${componentName}/logs`,
      {
        headers: {
          'Authorization': `Bearer ${DO_API_TOKEN}`,
        },
        params: {
          type: 'RUN',
          follow: false,
          tail_lines: 100,
        },
      }
    );

    return response.data.logs || [];
  } catch (error: any) {
    console.error('[DigitalOcean] Failed to get logs:', error.response?.data || error.message);
    return [];
  }
}
