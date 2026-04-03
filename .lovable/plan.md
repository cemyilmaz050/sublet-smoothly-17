
## SubIn Urgent Feature — Full Build Plan

### Phase 1: Database Foundation
1. **Migration** — Add columns to `listings` table: `is_urgent`, `minimum_price`, `urgency_deadline`, `urgency_reason`, `asking_price`
2. **Migration** — Create `offers` table with RLS policies
3. **Migration** — Create `counter_offers` table with RLS policies  
4. **Migration** — Create `price_alerts` table with RLS policies

### Phase 2: Listing Creation — Urgent Toggle
5. Update `ListingStep3` (pricing step) with urgent toggle, asking price, minimum price, urgency reason dropdown, deadline date picker
6. Update `ListingFormData` type and `CreateListingPage` to handle new fields

### Phase 3: Discover Page — Urgent Section
7. Create `UrgentListingCard` component with amber styling, countdown timer, savings badge, "Make an Offer" button
8. Add horizontal scrollable urgent section to top of discover page
9. Add "All Listings / ⚡ Urgent Only" filter toggle
10. Show urgent badge on urgent listings in regular grid

### Phase 4: Make an Offer Flow
11. Create `MakeOfferModal` component with 2-step flow (offer input with slider → review & submit)
12. Wire up offer submission to `offers` table
13. Send notification to tenant on new offer

### Phase 5: Tenant Offer Management
14. Create `OffersSection` component for tenant dashboard
15. Accept/Counter/Decline actions with appropriate logic
16. Auto-highlight offers above minimum price

### Phase 6: Counter-Offer Flow
17. Create counter-offer UI for both tenant and subtenant
18. Track rounds (max 3) in offers table
19. Notifications for counter-offers

### Phase 7: Offer Expiry Automation
20. Create `expire-offers` edge function
21. Set up pg_cron job to run every 10 minutes
22. Expiry notifications for both parties

### Phase 8: Dedicated /urgent Page
23. Create `/urgent` route with dark amber header, filters, grid of urgent cards
24. Add "⚡ Urgent" link to navbar in amber
25. Price alert subscription form

### Phase 9: Navigation & Polish
26. Add urgent nav link to desktop and mobile menus
27. Final notification wiring for all offer events
