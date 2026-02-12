import axios from 'axios';
import crypto from 'crypto';

const DO_API_BASE = 'https://api.digitalocean.com/v2';

/**
 * Read DO_API_TOKEN at request time (not module load time).
 * This avoids the race condition where dotenv hasn't loaded yet
 * when the module is first imported.
 */
function getDoToken(): string {
  const token = process.env.DO_API_TOKEN || '';
  if (!token) {
    console.error('[DigitalOcean] DO_API_TOKEN is not set — cannot provision apps');
    throw new Error('DigitalOcean API token is not configured. Please set DO_API_TOKEN.');
  }
  return token;
}

// The AI API key that powers each OpenClaw instance.
// Platform provides this — cost is covered by the subscription.
// Priority: Anthropic > OpenAI > OpenRouter (OpenAI-compatible with free models)
function getAIConfig() {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
  const AI_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || OPENROUTER_API_KEY || '';
  const AI_PROVIDER: 'anthropic' | 'openai' | 'openrouter' =
    process.env.ANTHROPIC_API_KEY ? 'anthropic' :
    process.env.OPENAI_API_KEY ? 'openai' : 'openrouter';
  return { AI_API_KEY, AI_PROVIDER, OPENROUTER_API_KEY };
}

// OpenRouter models per tier — higher plans get smarter AI
const OPENROUTER_MODELS: Record<string, string> = {
  starter: 'meta-llama/llama-3.1-8b-instruct:free',
  pro: 'anthropic/claude-3.5-haiku',
  business: 'anthropic/claude-sonnet-4-5',
};

export interface CreateAppParams {
  userId: number;
  userEmail: string;
  aiRole: string;
  tier: 'starter' | 'pro' | 'business';
  telegramBotToken?: string;
  customApiKey?: string;
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
 * Construct the expected live URL from the DO app name.
 * DO App Platform URLs follow the pattern: https://{app-name}-{random}.ondigitalocean.app
 * Since we don't know the random suffix at creation time, we return a best-effort URL
 * using just the app name. The actual URL will be updated once DO reports it.
 */
export function constructFallbackUrl(appName: string): string {
  return `https://${appName}.ondigitalocean.app`;
}

/**
 * Create a DigitalOcean App Platform application for OpenClaw
 */
export async function createOpenClawApp(params: CreateAppParams): Promise<any> {
  const { userId, userEmail, aiRole, tier, telegramBotToken, customApiKey, config } = params;
  const DO_API_TOKEN = getDoToken();
  const { AI_API_KEY, AI_PROVIDER } = getAIConfig();

  // Determine instance size based on tier
  // Valid slugs: basic-xxs, basic-xs, basic-s, basic-m, basic-l
  const instanceSizes = {
    starter: 'basic-xxs',
    pro: 'basic-xs',
    business: 'basic-s',
  };

  // Generate a unique gateway token for this instance's web UI access
  const gatewayToken = crypto.randomBytes(32).toString('hex');

  // Build the environment variables that OpenClaw actually expects.
  // See: https://docs.openclaw.ai/gateway/configuration
  const envs: AppSpec['services'][0]['envs'] = [
    // Gateway token for web UI access
    {
      key: 'OPENCLAW_GATEWAY_TOKEN',
      value: gatewayToken,
      scope: 'RUN_TIME',
    },
    // Bind to all interfaces so DO can route to it
    {
      key: 'OPENCLAW_GATEWAY_BIND',
      value: '0.0.0.0',
      scope: 'RUN_TIME',
    },
  ];

  // AI provider key — required for the bot brain.
  // If the customer provided their own key (Pro/Business), use it directly.
  // Otherwise fall back to the platform's key via OpenRouter.
  if (customApiKey) {
    // Detect provider from key prefix
    if (customApiKey.startsWith('sk-ant-')) {
      envs.push({ key: 'ANTHROPIC_API_KEY', value: customApiKey, scope: 'RUN_TIME' });
    } else if (customApiKey.startsWith('sk-or-')) {
      // Customer's own OpenRouter key
      envs.push({ key: 'OPENAI_API_KEY', value: customApiKey, scope: 'RUN_TIME' });
      envs.push({ key: 'OPENAI_BASE_URL', value: 'https://openrouter.ai/api/v1', scope: 'RUN_TIME' });
    } else {
      // Assume OpenAI-compatible key
      envs.push({ key: 'OPENAI_API_KEY', value: customApiKey, scope: 'RUN_TIME' });
    }
  } else if (AI_API_KEY) {
    // Platform-provided key
    if (AI_PROVIDER === 'anthropic') {
      envs.push({ key: 'ANTHROPIC_API_KEY', value: AI_API_KEY, scope: 'RUN_TIME' });
    } else if (AI_PROVIDER === 'openrouter') {
      const model = OPENROUTER_MODELS[tier] || OPENROUTER_MODELS.starter;
      envs.push({ key: 'OPENAI_API_KEY', value: AI_API_KEY, scope: 'RUN_TIME' });
      envs.push({ key: 'OPENAI_BASE_URL', value: 'https://openrouter.ai/api/v1', scope: 'RUN_TIME' });
      envs.push({ key: 'OPENAI_MODEL', value: model, scope: 'RUN_TIME' });
    } else {
      envs.push({ key: 'OPENAI_API_KEY', value: AI_API_KEY, scope: 'RUN_TIME' });
    }
  }

  // Telegram bot token (if provided by customer)
  if (telegramBotToken) {
    envs.push({
      key: 'TELEGRAM_BOT_TOKEN',
      value: telegramBotToken,
      scope: 'RUN_TIME',
    });
  }

  // Pass the communication channels config so OpenClaw enables the right plugins
  const channels = config?.communicationChannels || [];
  if (channels.includes('whatsapp')) {
    envs.push({ key: 'WHATSAPP_ENABLED', value: 'true', scope: 'RUN_TIME' });
  }
  if (channels.includes('discord')) {
    envs.push({ key: 'DISCORD_ENABLED', value: 'true', scope: 'RUN_TIME' });
  }

  // Pass the AI role as the system prompt / soul
  if (aiRole) {
    envs.push({
      key: 'OPENCLAW_SYSTEM_PROMPT',
      value: aiRole,
      scope: 'RUN_TIME',
    });
  }

  const appSpec: AppSpec = {
    name: `openclaw-${userId}-${Date.now()}`,
    region: 'nyc',
    services: [
      {
        name: 'openclaw-gateway',
        image: {
          registry_type: 'DOCKER_HUB',
          repository: 'alpine/openclaw',
          tag: 'latest',
        },
        instance_count: 1,
        instance_size_slug: instanceSizes[tier],
        envs,
        http_port: 18789, // OpenClaw gateway default port
      },
    ],
  };

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

    const app = response.data.app;

    // Issue 2 fix: If live_url is empty (app just created, not deployed yet),
    // construct a fallback URL from the app name.
    if (!app.live_url) {
      app.live_url = constructFallbackUrl(appSpec.name);
    }

    // Return the app data plus our generated gateway token
    return { ...app, gatewayToken };
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
  const DO_API_TOKEN = getDoToken();
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
  const DO_API_TOKEN = getDoToken();
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
  const DO_API_TOKEN = getDoToken();
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
  const DO_API_TOKEN = getDoToken();
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
