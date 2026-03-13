
import Footer from "@/components/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-3xl px-4 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 13, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using the SubIn platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. SubIn reserves the right to modify these Terms at any time, and your continued use constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. User Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for providing accurate and truthful information when creating listings, submitting applications, or completing their profiles. Tenants listing a sublet must have the legal right to sublet their apartment and must comply with their existing lease agreement. Subtenants must provide valid identification and accurate personal information during the verification process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              All payments are processed securely through Stripe. SubIn charges a 6% platform service fee on each transaction, which covers payment processing, identity verification, and platform maintenance. Security deposits are collected at the time of booking and held according to the terms of the sublet agreement. Monthly rent payments are due on the first of each month during the sublet period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Cancellation & Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subtenants may cancel and receive a full deposit refund within 48 hours of booking, provided the sublet has not yet started. After 48 hours, the security deposit is non-refundable. If a tenant cancels after a deposit has been paid, the subtenant receives an automatic full refund. SubIn reserves the right to process refunds at its discretion in cases of fraud, misrepresentation, or platform errors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Sublet Agreement Rules</h2>
            <p className="text-muted-foreground leading-relaxed">
              When a subtenant secures a listing, both parties will receive a digital sublet agreement that must be signed before the sublet is confirmed. The agreement includes the property address, sublet dates, rent amount, deposit amount, and names of both parties. Both the tenant and subtenant are legally bound by the terms of the signed agreement. SubIn facilitates the agreement but is not a party to the sublet itself.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Platform Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubIn acts as a marketplace connecting tenants and subtenants. We do not own, manage, or control any properties listed on the Platform. SubIn is not responsible for the condition of any property, the behavior of any user, or disputes between tenants and subtenants. To the fullest extent permitted by law, SubIn's liability is limited to the amount of platform fees paid by the user in the 12 months preceding any claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Account Suspension & Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              SubIn reserves the right to suspend or terminate any user account that violates these Terms, engages in fraudulent activity, or poses a risk to other users. Users may delete their account at any time by contacting support. Upon termination, any outstanding payments or obligations remain enforceable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, branding, and technology on the SubIn platform are the property of SubIn. Users retain ownership of content they upload (photos, descriptions) but grant SubIn a non-exclusive license to display and distribute that content on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at <a href="mailto:hello@subinapp.com" className="text-primary hover:underline">hello@subinapp.com</a>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsPage;
