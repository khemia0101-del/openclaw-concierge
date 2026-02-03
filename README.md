# OpenClaw Concierge

**Your Personal AI Employee in Under 60 Seconds**

OpenClaw Concierge is a SaaS platform that enables non-technical users to deploy and manage their own OpenClaw AI assistant with zero configuration. Simply answer a few questions, pay once, and your AI employee is ready to work.

## 🎯 Core Value Proposition

- **Zero Technical Knowledge Required**: No API keys, Docker, or configuration files
- **60-Second Setup**: From signup to deployment in under a minute
- **Fully Managed**: Automated provisioning, configuration, and maintenance
- **Enterprise Infrastructure**: Bank-level security with isolated instances

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- Wouter for routing
- tRPC for type-safe API calls

**Backend:**
- Node.js with Express
- tRPC 11 for API layer
- Drizzle ORM with MySQL/TiDB
- Stripe for payment processing
- DigitalOcean App Platform for AI instance provisioning

### Database Schema

**Users Table**
- Core authentication and profile information
- OAuth integration with Manus
- Role-based access control (admin/user)

**Subscriptions Table**
- Tracks user subscription plans (starter/pro/business)
- Stripe customer and subscription IDs
- Billing cycle and renewal dates

**AI Instances Table**
- Deployed OpenClaw instance details
- DigitalOcean App Platform app IDs
- Telegram bot credentials
- Configuration and status tracking

**Billing Records Table**
- Transaction history
- Setup fees and monthly charges
- Stripe payment intent IDs

**Usage Metrics Table**
- Token consumption tracking
- API call monitoring
- Cost calculations

## 🚀 Features

### Onboarding Flow

1. **Email Collection**: Simple email input to start
2. **Plan Selection**: Choose from Starter ($500 + $99/mo), Pro ($750 + $199/mo), or Business ($1000 + $299/mo)
3. **Payment Processing**: Secure Stripe Checkout for setup fee + first month
4. **AI Configuration**: Define your AI's role and communication channels
5. **Automated Deployment**: Instant provisioning on DigitalOcean

### Customer Dashboard

- **Subscription Status**: View plan details, renewal dates, and payment history
- **AI Instance Management**: Monitor status, view logs, restart instances
- **Access Details**: Telegram bot links and email addresses
- **Billing History**: Complete transaction records

### Admin Capabilities

- User management
- Subscription oversight
- Instance monitoring
- Billing administration

## 🔐 Security

- **Isolated Instances**: Each user gets a dedicated OpenClaw deployment
- **Encrypted Communication**: All data transmission uses TLS
- **Secure Credentials**: API keys and tokens stored in encrypted environment variables
- **PCI Compliance**: Stripe handles all payment card data

## 💳 Pricing

### Starter Plan
- $500 setup fee + $99/month
- Basic AI capabilities
- Email support
- 1,000 tokens/month
- Telegram integration

### Pro Plan (Most Popular)
- $750 setup fee + $199/month
- Advanced AI capabilities
- Priority support
- 5,000 tokens/month
- Multi-channel integration
- Custom skills

### Business Plan
- $1,000 setup fee + $299/month
- Enterprise AI capabilities
- 24/7 support
- Unlimited tokens
- All integrations
- Custom development
- Dedicated account manager

## 🛠️ Development Setup

### Prerequisites

- Node.js 22+
- pnpm package manager
- MySQL/TiDB database
- Stripe account (test mode)
- DigitalOcean account with API token

### Environment Variables

Required secrets (configured via Manus platform):
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `DO_API_TOKEN`: DigitalOcean Personal Access Token
- `DATABASE_URL`: MySQL connection string (auto-configured)
- `JWT_SECRET`: Session signing secret (auto-configured)

### Installation

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Testing

The platform includes comprehensive test coverage:

```bash
# Run all tests
pnpm test

# Test payment flow with Stripe test card
# Card: 4242 4242 4242 4242
# Expiry: Any future date
# CVC: Any 3 digits
```

## 📡 API Endpoints

### tRPC Procedures

**Onboarding**
- `onboarding.createCheckout`: Create Stripe Checkout session
- `onboarding.verifyPayment`: Verify payment and create subscription
- `onboarding.deployInstance`: Deploy AI instance to DigitalOcean

**Dashboard**
- `dashboard.getStatus`: Get subscription and instance details
- `dashboard.restartInstance`: Restart AI instance
- `dashboard.getLogs`: Retrieve instance logs

**Authentication**
- `auth.me`: Get current user
- `auth.logout`: End session

### Webhooks

**Stripe Webhook** (`/api/stripe/webhook`)
- Handles payment confirmations
- Processes subscription events
- Verifies webhook signatures

## 🔄 Deployment Flow

1. User completes onboarding and payment
2. Backend creates subscription record in database
3. DigitalOcean API provisions new App Platform app
4. OpenClaw Docker container deployed with user config
5. Environment variables injected (role, channels, credentials)
6. Instance status updated to "running"
7. User receives access details in dashboard

## 📊 Monitoring

- **Instance Status**: Real-time deployment status tracking
- **Logs**: Access to container logs via DigitalOcean API
- **Usage Metrics**: Token consumption and API call tracking
- **Billing**: Automated monthly subscription charges

## 🐛 Troubleshooting

### Payment Issues
- Verify Stripe keys in Settings → Payment
- Check webhook endpoint is accessible
- Review Stripe Dashboard → Developers → Webhooks

### Deployment Failures
- Check DigitalOcean API token validity
- Verify App Platform quota limits
- Review instance error messages in dashboard

### Database Connection
- Ensure DATABASE_URL is configured
- Check database server accessibility
- Verify schema migrations are applied

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For technical support or questions:
- Email: support@openclaw-concierge.com
- Documentation: https://docs.openclaw-concierge.com
- Status Page: https://status.openclaw-concierge.com

---

Built with ❤️ for non-technical users who want the power of AI without the complexity.
