# OpenClaw Concierge - Testing Guide

## End-to-End Payment Flow Testing

### Prerequisites
- Dev server running at the provided URL
- Stripe test mode enabled (test keys configured)
- DO_API_TOKEN environment variable set

### Test Flow

#### 1. Homepage to Onboarding
1. Navigate to homepage
2. Click "Get Your OpenClaw AI" button
3. Should redirect to `/onboarding`

#### 2. Onboarding Step 1 - Email
1. Enter test email: `test@example.com`
2. Click "Continue"
3. Should advance to Step 2

#### 3. Onboarding Step 2 - Plan Selection
1. Select a plan (Starter/Pro/Business)
2. Review pricing:
   - Starter: $250 setup + $49/month
   - Pro: $250 setup + $99/month
   - Business: $250 setup + $149/month
3. Click "Proceed to Payment"
4. Should redirect to Stripe Checkout

#### 4. Stripe Checkout
1. Use Stripe test card: `4242 4242 4242 4242`
2. Expiry: Any future date (e.g., 12/34)
3. CVC: Any 3 digits (e.g., 123)
4. ZIP: Any 5 digits (e.g., 12345)
5. Complete payment
6. Should redirect to `/onboarding/configure?session_id=...`

#### 5. Payment Verification
1. Page should show "Verifying payment..." spinner
2. After 2-3 seconds, should show "Payment Successful!" message
3. Should display configuration form

#### 6. AI Configuration
1. Enter AI role description (required)
2. Select communication channels (Telegram, WhatsApp, Discord, Email)
3. Optionally enter Telegram bot token
4. Select connected services (Calendar, CRM, Email Service)
5. Click "Deploy AI Employee"

#### 7. Deployment Progress
1. Should show deployment progress UI with 6 steps:
   - Verifying payment (~2s)
   - Creating subscription (~3s)
   - Provisioning server (~15s)
   - Configuring AI assistant (~10s)
   - Deploying to production (~8s)
   - AI Employee ready! (~2s)
2. Progress bar should animate from 0% to 100%
3. Each step should show spinner → checkmark as it completes
4. Total duration: ~40 seconds

#### 8. Dashboard Redirect
1. After deployment completes, should show success toast
2. Should redirect to `/dashboard`
3. Dashboard should display:
   - User subscription details
   - AI instance status
   - Configuration summary

### Expected Database State After Test

**leads table:**
- Email: test@example.com
- Status: checkout_started
- Tier: selected plan
- Stripe session ID: cs_test_...

**subscriptions table:**
- User ID: temporary ID (timestamp)
- Tier: selected plan
- Status: active
- Stripe subscription ID: (if using subscriptions)

**instances table:**
- User ID: matches subscription
- Status: active
- AI role: entered description
- Communication channels: selected channels
- DigitalOcean app ID: (from deployment)

**billing_records table:**
- Setup fee record: $250
- Monthly subscription record: $49/$99/$149

### Common Issues & Troubleshooting

#### Issue: "No active subscription found"
- **Cause:** Payment verification failed or subscription not created
- **Fix:** Check Stripe webhook logs, verify session_id in URL

#### Issue: Blank page after payment
- **Cause:** Redirect URL using localhost instead of dev server URL
- **Fix:** Verify `window.location.origin` is passed to createCheckout

#### Issue: Deployment hangs or fails
- **Cause:** DigitalOcean API error or missing DO_API_TOKEN
- **Fix:** Check server logs, verify DO_API_TOKEN is set

#### Issue: Dashboard shows no instance
- **Cause:** Deployment succeeded but instance not saved to database
- **Fix:** Check deployInstance mutation logs

### Manual Testing Checklist

- [ ] Homepage loads correctly
- [ ] Onboarding step 1 validates email
- [ ] Onboarding step 2 shows correct pricing
- [ ] Stripe checkout opens with correct amount
- [ ] Payment completes successfully
- [ ] Configure page verifies payment
- [ ] Configure form accepts AI role input
- [ ] Deployment progress UI displays all steps
- [ ] Progress bar animates smoothly
- [ ] Dashboard shows instance after deployment
- [ ] Email captured in leads table
- [ ] Subscription created in database
- [ ] Billing records created correctly

### Automated Testing

Run the test suite:
```bash
pnpm test
```

Expected results:
- All 13+ tests should pass
- No TypeScript errors
- No console errors during test run

### Production Deployment Testing

Before going live:
1. Switch Stripe keys from test to live mode
2. Verify webhook endpoint is configured in Stripe dashboard
3. Test with real payment (use 99% discount promo code)
4. Verify actual DigitalOcean app is provisioned
5. Test AI instance responds to messages
6. Verify billing cycle triggers correctly

### Monitoring

After launch, monitor:
- Stripe Dashboard → Payments (successful charges)
- Stripe Dashboard → Webhooks (event delivery)
- Database → leads table (conversion funnel)
- Database → instances table (active deployments)
- DigitalOcean Dashboard → Apps (running instances)
