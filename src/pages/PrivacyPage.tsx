
const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div className="flex-1 container max-w-3xl px-4 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 13, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly, including your name, email address, phone number, profile photo, government-issued ID (for verification), and any content you upload to the Platform such as listing photos and descriptions. We also collect usage data including pages visited, features used, device information, and IP address.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information is used to provide and improve the SubIn platform, including creating and managing your account, processing payments, facilitating communication between tenants and subtenants, verifying user identities, sending transactional emails (booking confirmations, payment receipts, application updates), and displaying listing information to other users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Payment Data Handling</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubIn does not store credit card numbers or sensitive payment information on its servers. All payment processing is handled by Stripe, a PCI-DSS Level 1 certified payment processor. We store only transaction references, amounts, and payment status for record-keeping purposes. For more information on how Stripe handles your data, please review Stripe's Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We share your information only as necessary to provide the Platform's services. This includes sharing your profile information with other users you interact with (e.g., tenants can see subtenant profiles when reviewing applications), sharing payment information with Stripe for processing, and sharing data with property managers when required for sublet approval. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard security measures to protect your data, including encryption in transit (TLS/SSL), secure database storage with row-level security policies, and regular security audits. Government-issued IDs uploaded for verification are stored in private, encrypted storage buckets accessible only to authorized personnel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal information at any time through your account settings. You may request a copy of all data we hold about you by contacting us. You may also request deletion of your account and all associated data. We will respond to all data requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubIn uses essential cookies to maintain your session and preferences. We may use analytics tools to understand how the Platform is used and to improve our services. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. Transaction records are retained for 7 years for legal and tax compliance. After account deletion, personal data is removed within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy-related questions or data requests, contact us at <a href="mailto:hello@subinapp.com" className="text-primary hover:underline">hello@subinapp.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
