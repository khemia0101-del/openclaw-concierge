# OpenClaw Concierge MVP - Project TODO

## Phase 1: Database & Backend Setup
- [x] Define database schema (users, subscriptions, ai_instances, billing_records)
- [x] Create Drizzle migrations
- [x] Set up environment variables for Stripe and DigitalOcean
- [x] Create DigitalOcean API service wrapper
- [x] Create Stripe API service wrapper

## Phase 2: Authentication & Payments
- [x] Implement user registration endpoint
- [x] Implement user login endpoint
- [x] Add Stripe Checkout integration
- [x] Create webhook handler for payment.intent.succeeded
- [x] Create webhook handler for payment.intent.payment_failed

## Phase 3: Onboarding Flow
- [x] Create registration page (email, password)
- [x] Create pricing/tier selection page
- [x] Create Stripe Checkout page
- [x] Create AI configuration page (role definition, communication channel)
- [x] Create review & deploy page
- [x] Add form validation and error handling

## Phase 4: DigitalOcean Provisioning
- [x] Create provisioning service to create DO App Platform apps
- [x] Implement environment variable injection for user config
- [ ] Create custom OpenClaw Docker image with entrypoint script
- [ ] Implement deployment status polling
- [ ] Create deployment completion handler

## Phase 5: Customer Dashboard
- [x] Create dashboard layout and navigation
- [x] Display subscription status and renewal date
- [x] Display AI instance details (Telegram link, email address, status)
- [x] Add instance control buttons (view logs, restart)
- [x] Display deployment progress during provisioning

## Phase 6: Webhooks & Monitoring
- [ ] Create DigitalOcean webhook handler for deployment updates
- [ ] Implement deployment status updates to database
- [ ] Create notification system for deployment completion
- [ ] Add error handling and retry logic

## Phase 7: Testing & Polish
- [ ] Test complete onboarding flow end-to-end
- [ ] Test payment processing
- [ ] Test DigitalOcean provisioning
- [ ] Test dashboard functionality
- [ ] Add error messages and user feedback
- [ ] Performance optimization

## Phase 8: Deployment & Final Checkpoint
- [ ] Create checkpoint with all MVP features
- [ ] Document setup instructions
- [ ] Prepare for production deployment

## Phase 9: UI Redesign to Match OpenClaw
- [x] Analyze OpenClaw website design (colors, typography, layout)
- [x] Update global CSS with OpenClaw color scheme
- [x] Update typography and font choices
- [x] Redesign landing page hero section
- [x] Update pricing section styling
- [x] Redesign onboarding wizard UI
- [x] Update dashboard layout and styling
- [x] Ensure consistent design system across all pages
- [x] Test responsive design on mobile/tablet

## Phase 10: Rebrand to Integrate Fast
- [x] Update page title and meta tags to "Integrate Fast"
- [x] Replace "OpenClaw" with "Integrate Fast" in hero section
- [x] Update tagline to emphasize concierge service offering
- [x] Change value proposition messaging (you provide OpenClaw setup)
- [x] Update footer branding
- [x] Update onboarding page branding
- [x] Update dashboard branding
- [x] Keep OpenClaw dark space aesthetic (green borders, red accents, stars)
- [x] Test all pages for consistent branding

## Phase 11: Competitive Research & Analysis
- [ ] Research SimpleClaw.com marketing strategies
- [ ] Identify other OpenClaw/AI assistant competitors
- [ ] Analyze successful marketing trends and tactics
- [ ] Document findings for implementation

## Phase 12: Alex Hormozi Strategy Implementation
- [ ] Review Alex Hormozi PDF strategies
- [ ] Extract actionable tactics for OpenClaw Concierge
- [ ] Implement value stacking techniques
- [ ] Add urgency and scarcity elements
- [ ] Implement guarantee/risk reversal
- [ ] Add social proof and testimonials
- [ ] Optimize CTA buttons and copy

## Phase 13: Pricing Updates (50% OFF Sale)
- [ ] Update setup fee: $500 → $250 (show as 50% off)
- [ ] Update Starter plan: $99 → $49/month
- [ ] Update Professional plan: $199 → $99/month
- [ ] Update Business plan: $299 → $149/month
- [ ] Add "50% OFF SALE" badges and messaging
- [ ] Update Stripe product prices
- [ ] Add countdown timer for urgency

## Phase 14: Affiliate Program Backend
- [ ] Create affiliates database table
- [ ] Create referrals tracking table
- [ ] Create commissions table
- [ ] Build affiliate registration endpoint
- [ ] Build referral tracking system (unique links)
- [ ] Build commission calculation logic (30% lifetime)
- [ ] Build payout management system
- [ ] Create affiliate dashboard API endpoints

## Phase 15: Affiliate Program Frontend
- [ ] Create affiliate signup page
- [ ] Create affiliate dashboard
- [ ] Build referral link generator
- [ ] Build commission calculator (30% LTV)
- [ ] Create earnings/stats display
- [ ] Add payout request functionality
- [ ] Create affiliate marketing materials page

## Phase 16: Comprehensive SEO Optimization
- [ ] Add structured data (Schema.org markup)
- [ ] Optimize all page titles and descriptions
- [ ] Add Open Graph tags for social sharing
- [ ] Create XML sitemap
- [ ] Add robots.txt
- [ ] Optimize images with alt tags
- [ ] Add internal linking structure
- [ ] Implement canonical URLs
- [ ] Add FAQ schema markup
- [ ] Optimize page load speed

## Phase 17: Affiliate Program UX Fixes
- [ ] Create public-facing affiliate program landing page at `/affiliate-program`
- [ ] Add commission calculator to public page (visible to all visitors)
- [ ] Add program benefits and details to public page (30% lifetime commission, etc.)
- [ ] Add clear "Join Now" CTA that requires login/signup
- [ ] Update footer link to point to `/affiliate-program` instead of `/affiliate`
- [ ] Add navigation link to affiliate program in header
- [ ] Test complete affiliate signup flow from landing page

## Update: Phase 17 Completed
- [x] Create public-facing affiliate program landing page at `/affiliate-program`
- [x] Add commission calculator to public page (visible to all visitors)
- [x] Add program benefits and details to public page (30% lifetime commission, etc.)
- [x] Add clear "Join Now" CTA that requires login/signup
- [x] Update footer link to point to `/affiliate-program` instead of `/affiliate`
- [x] Add navigation link to affiliate program in header
- [ ] Test complete affiliate signup flow from landing page

## Phase 18: SEO Optimization Fixes
- [x] Reduce keywords from 14 to 5 focused keywords
- [x] Shorten title from 84 to 52 characters using document.title
- [x] Reduce description from 196 to 156 characters
- [ ] Test SEO improvements

## Phase 19: Add Legacy Brand Keywords
- [x] Add "clawdbot" and "moltbot" to SEO keywords
- [x] Test keyword count stays within 3-8 range (now 7 keywords total)

## Phase 20: Fix Onboarding & Stripe Pricing
- [x] Update onboarding page pricing display to show sale prices
- [x] Update Stripe product definitions with new prices
- [ ] Test checkout flow with new pricing
- [ ] Verify Stripe webhook handles new prices correctly

## Phase 21: Complete Onboarding Flow (CRITICAL BUG)
- [x] Create /onboarding/configure page for post-payment setup
- [x] Verify Stripe payment session on configure page
- [x] Collect AI configuration (role, channels, tokens)
- [x] Wire up deployment logic to existing deployInstance mutation
- [x] Add route to App.tsx
- [ ] Test full flow: payment → configure → deploy → success

## Phase 22: Fix Stripe Redirect URLs (CRITICAL BUG)
- [x] Update Stripe checkout to use window.location.origin instead of hardcoded localhost
- [x] Update backend to accept origin parameter
- [x] Update frontend to pass window.location.origin
- [x] Test payment flow redirects to correct URL

## Phase 23: Email Lead Capture for Marketing
- [x] Create leads table in database schema
- [x] Add lead capture when email is entered in onboarding
- [x] Prevent duplicate email entries (onDuplicateKeyUpdate)
- [x] Track conversion status (lead → checkout_started → paid)
- [x] Update lead status with Stripe session ID
