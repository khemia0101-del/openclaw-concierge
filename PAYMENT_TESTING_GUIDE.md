# Payment Flow Testing Guide

This guide walks you through testing the complete OpenClaw customer onboarding and payment flow.

---

## 🎯 Complete Customer Journey

### Step 1: Homepage
1. Navigate to your published site (e.g., `openclawai-nxhj2ewv.manus.space`)
2. Verify the homepage loads with:
   - ✅ "50% OFF" sale messaging
   - ✅ Pricing: $250 setup + $49/$99/$149 monthly
   - ✅ Strikethrough original prices ($500 setup + $98/$198/$298 monthly)
   - ✅ "Get Your OpenClaw AI" CTA button

### Step 2: Onboarding - Email Capture
1. Click "Get Your OpenClaw AI"
2. Enter a test email (e.g., `test@example.com`)
3. Click "Continue"
4. ✅ Verify email is saved to `leads` table in database

### Step 3: Onboarding - Plan Selection
1. Review the three pricing tiers:
   - **Starter**: $299 total ($250 setup + $49/month)
   - **Pro**: $349 total ($250 setup + $99/month)
   - **Business**: $399 total ($250 setup + $149/month)
2. Select a plan (e.g., "Starter")
3. Click "Continue to Payment"
4. ✅ Verify redirect to Stripe Checkout

### Step 4: Stripe Checkout
1. Verify Stripe checkout page shows:
   - ✅ Correct plan name and price
   - ✅ Email pre-filled
   - ✅ "Add code" button for promo codes
2. Enter test card details:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
3. Click "Pay"
4. ✅ Verify payment succeeds

### Step 5: Post-Payment Redirect
1. After payment, verify redirect to `/onboarding/configure?session_id=cs_...`
2. ✅ Page should load successfully (no JavaScript errors)
3. ✅ "Payment Successful!" message should appear
4. ✅ Verify subscription created in database:
   ```sql
   SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 1;
   ```

### Step 6: AI Configuration
1. Fill in the configuration form:
   - **AI Employee Role**: "Help manage administrative tasks for my company"
   - **Communication Channels**: Select "Telegram"
   - **Telegram Bot Token**: Enter test token (e.g., `1234567890:ABCdefGHIjklMNOpqrs`)
   - **Connected Services**: Select "Email Service Integration"
2. Click "Deploy AI Employee"
3. ✅ Deployment progress UI should appear

### Step 7: Deployment Progress
1. Watch the 6-step progress animation:
   - ✅ Verifying payment...
   - ✅ Creating subscription...
   - ✅ Provisioning server...
   - ✅ Installing dependencies...
   - ✅ Configuring AI...
   - ✅ Finalizing deployment...
2. Progress should take ~30-60 seconds
3. ✅ Verify no errors during deployment

### Step 8: Dashboard Redirect
1. After deployment completes, verify redirect to `/dashboard`
2. ✅ Dashboard should show:
   - User's email
   - Active subscription tier
   - AI instance status
   - Usage metrics (if available)

---

## 🧪 Test Scenarios

### Scenario A: Happy Path (Starter Plan)
- Email: `starter-test@example.com`
- Plan: Starter ($299)
- Expected: Complete flow with no errors

### Scenario B: Pro Plan
- Email: `pro-test@example.com`
- Plan: Pro ($349)
- Expected: Complete flow with correct pricing

### Scenario C: Business Plan
- Email: `business-test@example.com`
- Plan: Business ($399)
- Expected: Complete flow with correct pricing

### Scenario D: Abandoned Cart
- Email: `abandoned@example.com`
- Plan: Starter
- Action: Close Stripe checkout before paying
- Expected: Lead saved with status "checkout_started"

### Scenario E: Duplicate Email
- Email: Use same email twice
- Expected: Lead record updated (not duplicated)

---

## 🔍 Database Verification

After each test, verify data in the database:

### Check Leads Table
```sql
SELECT email, tier, status, created_at 
FROM leads 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected columns:
- `email`: User's email
- `tier`: "starter" | "pro" | "business"
- `status`: "lead" | "checkout_started" | "paid"
- `stripe_session_id`: Stripe checkout session ID
- `created_at`: Timestamp

### Check Subscriptions Table
```sql
SELECT user_id, tier, status, stripe_customer_id, created_at 
FROM subscriptions 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected columns:
- `user_id`: Temporary user ID (timestamp)
- `tier`: "starter" | "pro" | "business"
- `status`: "active" | "canceled" | "past_due"
- `stripe_customer_id`: Stripe customer ID (starts with `cus_`)
- `stripe_subscription_id`: Stripe subscription ID (starts with `sub_`)

### Check Instances Table
```sql
SELECT user_id, status, droplet_id, ip_address, created_at 
FROM instances 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected columns:
- `user_id`: Matches subscription user_id
- `status`: "provisioning" | "active" | "failed"
- `droplet_id`: DigitalOcean droplet ID
- `ip_address`: Public IP of deployed instance

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: JavaScript Error After Payment
**Symptom**: "An unexpected error occurred" after Stripe redirect

**Cause**: Missing React imports or build errors

**Fix**: 
1. Check browser console for errors
2. Verify `OnboardingConfigure.tsx` has React imports
3. Rebuild and republish

### Issue 2: "No active subscription found"
**Symptom**: Error when clicking "Deploy AI Employee"

**Cause**: Payment verification failed or subscription not created

**Fix**:
1. Check `verifyPayment` mutation logs
2. Verify Stripe session ID is valid
3. Check database for subscription record

### Issue 3: Deployment Stuck at "Provisioning server..."
**Symptom**: Progress UI stuck on step 3

**Cause**: DigitalOcean API error or DO_API_TOKEN not configured

**Fix**:
1. Check server logs: `tail -100 .manus-logs/devserver.log`
2. Verify DO_API_TOKEN environment variable is set
3. Check DigitalOcean API status

### Issue 4: Stripe Webhook Not Firing
**Symptom**: Subscription status not updating after payment

**Cause**: Webhook endpoint not configured or signature verification failing

**Fix**:
1. Check Stripe Dashboard → Developers → Webhooks
2. Verify webhook URL: `https://your-domain.manus.space/api/stripe/webhook`
3. Check webhook logs for delivery status

### Issue 5: Localhost Redirect After Payment
**Symptom**: Redirects to `localhost:3000` instead of production URL

**Cause**: Hardcoded localhost in Stripe checkout success_url

**Fix**:
1. Verify `createCheckout` mutation uses `input.origin`
2. Frontend should pass `window.location.origin`
3. Republish after fix

---

## 📊 Success Metrics

After testing, verify these metrics:

- ✅ **Conversion Rate**: Leads → Paid customers
- ✅ **Payment Success Rate**: Stripe checkouts → Successful payments
- ✅ **Deployment Success Rate**: Payments → Active instances
- ✅ **Time to Deploy**: Payment → Dashboard (target: <2 minutes)
- ✅ **Error Rate**: JavaScript errors / Total page views (target: <1%)

---

## 🔐 Stripe Test Cards

### Successful Payments
- **Basic**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0027 6000 3184`

### Failed Payments
- **Declined**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

### Special Cases
- **Require Authentication**: `4000 0025 0000 3155`
- **Dispute**: `4000 0000 0000 0259`

---

## 🚀 Production Checklist

Before accepting real customers:

- [ ] Test complete flow with Stripe test card
- [ ] Verify all database tables populated correctly
- [ ] Confirm email lead capture working
- [ ] Test Error Boundary with intentional error
- [ ] Configure Sentry DSN for error tracking
- [ ] Verify DigitalOcean API integration
- [ ] Test deployment creates actual droplet
- [ ] Confirm dashboard shows correct data
- [ ] Test promo code functionality
- [ ] Verify Stripe webhook processes events
- [ ] Test abandoned cart tracking
- [ ] Confirm duplicate email handling
- [ ] Review server logs for errors
- [ ] Test mobile responsiveness
- [ ] Verify SSL certificate valid
- [ ] Test with multiple browsers

---

## 📞 Support

If you encounter issues during testing:

1. **Check Logs**:
   - Browser Console: Right-click → Inspect → Console
   - Server Logs: `.manus-logs/devserver.log`
   - Database: Management UI → Database panel

2. **Review Documentation**:
   - `TESTING.md` - General testing guide
   - `README.md` - Project overview
   - Stripe Docs: https://stripe.com/docs/testing

3. **Contact Support**:
   - Email: support@openclawai.com
   - Manus Help: https://help.manus.im

---

**Last Updated**: 2026-02-04
**Version**: 1.0.0
