import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, GraduationCap, Building2 } from "lucide-react";

import { useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  terms?: string;
}

const SignUpPage = () => {
  const { user, isReady } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const intent = searchParams.get("intent") || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const isEduEmail = email.trim().toLowerCase().endsWith(".edu");

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.redirected) return;
      if (result?.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setGoogleLoading(false);
        return;
      }
      setGoogleLoading(false);
      navigate("/listings", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
      setGoogleLoading(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Please enter your full name";
    if (!email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Please create a password";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!isReady) {
      setSubmitError("Hold on, we're still loading. Try again in a sec.");
      return;
    }

    if (!validate()) {
      setSubmitError(null);
      return;
    }

    // Determine role from intent
    const isBbgEmail = email.trim().toLowerCase().endsWith("@realestateboston.com");
    let effectiveRole = "tenant";
    if (isBbgEmail) effectiveRole = "manager";
    else if (intent === "subtenant" || intent === "renter") effectiveRole = "subtenant";

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setLoading(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: effectiveRole,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setSubmitError(null);
          setDuplicateEmail(email);
          return;
        }
        setSubmitError(error.message);
        return;
      }

      const identities = data.user?.identities ?? [];
      const isRepeatedSignup = data.user && !data.session && identities.length === 0;
      if (isRepeatedSignup) {
        setSubmitError(null);
        setDuplicateEmail(email);
        return;
      }

      if (data.user && !data.session) {
        setSubmitError(null);
        setEmailSent(true);
        return;
      }

      if (data.session) {
        if (intent === "tenant") navigate("/listings/create", { replace: true });
        else navigate("/listings", { replace: true });
        return;
      }

      setSubmitError("Something went wrong. Please try again.");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (targetEmail: string) => {
    if (resendCooldown > 0) return;
    setResending(true);
    setResendSuccess(false);
    const { error } = await supabase.auth.resend({ type: "signup", email: targetEmail });
    if (error) {
      toast.error(error.message);
    } else {
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    setResending(false);
  };

  // Duplicate account screen
  if (duplicateEmail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-[28px] font-bold text-foreground">You already have an account</h1>
            <p className="text-[15px] text-muted-foreground">
              <strong className="text-foreground">{duplicateEmail}</strong> is already registered. Want to log in instead?
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/login")} size="lg" className="h-12 text-[15px]">Log in instead</Button>
              <Button variant="outline" onClick={() => handleResendVerification(duplicateEmail)} disabled={resending || resendCooldown > 0} className="h-12 text-[15px]">
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
              </Button>
              <button onClick={() => setDuplicateEmail(null)} className="text-[13px] text-muted-foreground hover:text-primary">
                Try a different email
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Email sent confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-[28px] font-bold text-foreground">Check your inbox</h1>
            <p className="text-[15px] text-muted-foreground">
              We sent a verification link to <strong className="text-foreground">{email}</strong>. Click the link to activate your account.
            </p>
            {isEduEmail && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-[13px] font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                You'll get a Student Verified badge
              </div>
            )}
            <p className="text-[13px] text-muted-foreground">Don't see it? Check your <strong>spam or junk folder</strong>.</p>

            <div className="space-y-1">
              <p className="text-[13px] text-muted-foreground">Didn't receive the email?</p>
              {resendSuccess ? (
                <p className="text-[13px] font-medium text-emerald-600">Email resent!</p>
              ) : resendCooldown > 0 ? (
                <p className="text-[13px] font-medium text-muted-foreground">
                  Resend in 0:{resendCooldown.toString().padStart(2, "0")}
                </p>
              ) : resending ? (
                <p className="text-[13px] font-medium text-primary">Sending...</p>
              ) : (
                <button
                  onClick={() => handleResendVerification(email)}
                  className="text-[13px] font-medium text-primary hover:underline"
                >
                  Resend verification email
                </button>
              )}
            </div>

            <button onClick={() => setEmailSent(false)} className="text-[13px] text-muted-foreground hover:text-primary">
              Wrong email? Go back
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex items-center justify-center px-4 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-[28px] font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">Takes under 30 seconds</p>
          </div>

          <div className="mt-8 space-y-5">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-border bg-card px-4 h-14 text-[15px] font-medium text-foreground shadow-sm transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/30 disabled:opacity-60 disabled:pointer-events-none"
            >
              {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <GoogleIcon />}
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
            </div>

            <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-card">
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" placeholder="John Doe" className="mt-1.5 h-12 text-[16px]" autoComplete="name"
                    value={fullName} onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }} />
                  {errors.fullName && <p className="mt-1 text-[13px] text-destructive">{errors.fullName}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@email.com" className="mt-1.5 h-12 text-[16px]" autoComplete="email"
                    value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} />
                  {errors.email && <p className="mt-1 text-[13px] text-destructive">{errors.email}</p>}
                  {isEduEmail && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-primary font-medium">
                      <GraduationCap className="h-4 w-4" />
                      You'll get a Student Verified badge
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password" className="pr-10 h-12 text-[16px]" autoComplete="new-password"
                      value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-[13px] text-destructive">{errors.password}</p>
                  ) : (
                    <p className="mt-1 text-[13px] text-muted-foreground">At least 6 characters</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <Checkbox id="signup-terms" checked={agreedToTerms}
                      onCheckedChange={(v) => { setAgreedToTerms(v === true); setErrors((p) => ({ ...p, terms: undefined })); }}
                      className="mt-0.5 h-4 w-4 shrink-0" />
                    <label htmlFor="signup-terms" className="text-[13px] leading-relaxed text-muted-foreground cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>
                  {errors.terms && <p className="ml-7 text-[13px] text-destructive">{errors.terms}</p>}
                </div>
                {submitError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive">{submitError}</div>
                )}
                <Button className="w-full h-12 text-[15px]" size="lg" type="submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
                  ) : (
                    <>Create account <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
              </form>
            </div>

            <p className="text-center text-[15px] text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
