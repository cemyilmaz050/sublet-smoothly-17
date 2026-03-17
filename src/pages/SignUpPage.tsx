import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Search, Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, GraduationCap, Building2 } from "lucide-react";

import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
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
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  terms?: string;
}

const SignUpPage = () => {
  const { user, isReady } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") as "tenant" | "subtenant" | "manager" | null;
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | "manager" | null>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [nonBbgManagerBlock, setNonBbgManagerBlock] = useState(false);

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

  const roles = [
    {
      id: "tenant" as const,
      icon: Home,
      title: "I'm leaving my place",
      description: "I want to sublet my apartment and find a verified guest",
    },
    {
      id: "subtenant" as const,
      icon: Search,
      title: "I need a place",
      description: "I want to browse sublets and find the perfect summer spot",
    },
    {
      id: "manager" as const,
      icon: Building2,
      title: "I am a property manager",
      description: "Manage your properties and oversee sublet listings on SubIn",
    },
  ];

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!password) {
      newErrors.password = "Password is required";
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

    if (!selectedRole) {
      setSubmitError("Pick whether you're leaving, looking, or managing first!");
      setStep(1);
      return;
    }

    if (!validate()) {
      setSubmitError(null);
      return;
    }

    // If manager role selected, check email domain
    const isBbgEmail = email.trim().toLowerCase().endsWith("@realestateboston.com");
    if (selectedRole === "manager" && !isBbgEmail) {
      setSubmitError(null);
      setNonBbgManagerBlock(true);
      return;
    }

    setLoading(true);
    setSubmitError(null);

    // Use manager role for BBG emails regardless of selection, or if they picked manager
    const effectiveRole = isBbgEmail ? "manager" : selectedRole;

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
        navigate("/listings", { replace: true });
        return;
      }

      setSubmitError("Hmm, something didn't work. Give it another try!");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (targetEmail: string) => {
    if (resendCooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: targetEmail });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email resent! Check your inbox.");
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

  // Non-BBG manager block screen
  if (nonBbgManagerBlock) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Property Manager Access</h1>
            <p className="text-muted-foreground leading-relaxed">
              The property manager dashboard is currently only available to Boston Brokerage Group staff. If you are a BBG employee, please use your official BBG email address to sign in.
            </p>
            <p className="text-sm text-muted-foreground">
              If you are a different property manager, contact us at{" "}
              <a href="mailto:hello@subinapp.com" className="font-medium text-primary hover:underline">hello@subinapp.com</a>{" "}
              to get set up on SubIn.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => { setNonBbgManagerBlock(false); setStep(2); }} size="lg">
                Try with a BBG email
              </Button>
              <Button variant="outline" onClick={() => navigate("/listings")}>
                Browse listings instead
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Duplicate account screen
  if (duplicateEmail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">You already have an account!</h1>
            <p className="text-muted-foreground">
              <strong className="text-foreground">{duplicateEmail}</strong> is already registered. Want to log in instead?
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/login")} size="lg">Log In Instead</Button>
              <Button variant="outline" onClick={() => handleResendVerification(duplicateEmail)} disabled={resending || resendCooldown > 0}>
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Resend verification in ${resendCooldown}s` : "Resend Verification Email"}
              </Button>
              <button onClick={() => setDuplicateEmail(null)} className="text-sm text-muted-foreground hover:text-primary">
                ← Try a different email
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check your inbox! 📬</h1>
            <p className="text-muted-foreground">
              We sent a verification link to <strong className="text-foreground">{email}</strong>. Click the link to activate your account.
            </p>
            {isEduEmail && (
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <GraduationCap className="h-4 w-4" />
                Nice — you'll get a Student Verified badge
              </div>
            )}
            <p className="text-xs text-muted-foreground">Don't see it? Check your <strong>spam or junk folder</strong>.</p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => handleResendVerification(email)} disabled={resending || resendCooldown > 0} variant="outline" size="lg">
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
              </Button>
              <button onClick={() => { setEmailSent(false); setStep(2); }} className="text-sm text-muted-foreground hover:text-primary">
                Wrong email? ← Go back
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex items-center justify-center px-4 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {step === 1 ? "What brings you to SubIn?" : "Let's get you set up"}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {step === 1 ? "Pick one — you can always switch later" : "Takes under 30 seconds"}
            </p>
          </div>

          {step === 1 && (
            <div className="mt-8 space-y-4">
              {/* Google Sign In — most prominent */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-border bg-card px-4 h-14 text-base font-medium text-foreground shadow-sm transition-all hover:bg-accent/50 hover:shadow-md hover:border-primary/30 disabled:opacity-60 disabled:pointer-events-none"
              >
                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <GoogleIcon />}
                {googleLoading ? "Connecting..." : "Continue with Google — fastest way in"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or sign up with email</span></div>
              </div>

              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role.id); setStep(2); }}
                  className={cn(
                    "group w-full rounded-xl border-2 p-4 sm:p-5 text-left transition-all hover:border-primary hover:bg-accent/50",
                    selectedRole === role.id ? "border-primary bg-accent/50" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <role.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{role.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary shrink-0" />
                  </div>
                </button>
              ))}
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8 shadow-card">
              <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" className="mt-1.5 h-12" autoComplete="given-name"
                      value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); }} />
                    {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="mt-1.5 h-12" autoComplete="family-name"
                      value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); }} />
                    {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@university.edu" className="pl-10 h-12" autoComplete="email"
                      value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                  {isEduEmail && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-primary font-medium">
                      <GraduationCap className="h-4 w-4" />
                      Nice — you get a Student Verified badge
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="Create a password" className="pr-10 h-12" autoComplete="new-password"
                      value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Must be at least 6 characters</p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <Checkbox id="signup-terms" checked={agreedToTerms}
                      onCheckedChange={(v) => { setAgreedToTerms(v === true); setErrors((p) => ({ ...p, terms: undefined })); }}
                      className="mt-0.5 h-4 w-4 shrink-0" />
                    <label htmlFor="signup-terms" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>
                    </label>
                  </div>
                  {errors.terms && <p className="ml-7 text-sm text-destructive">{errors.terms}</p>}
                </div>
                {submitError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{submitError}</div>
                )}
                <Button className="w-full h-12" size="lg" type="submit" disabled={loading}>
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating your account...</>
                  ) : (
                    <>Let's Go! <ArrowRight className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-primary">← Back</button>
                  <p className="text-sm text-muted-foreground">
                    Have an account?{" "}
                    <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
                  </p>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default SignUpPage;
