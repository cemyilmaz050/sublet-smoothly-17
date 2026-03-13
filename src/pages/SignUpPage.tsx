import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Search, Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

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
  const initialRole = searchParams.get("role") as "tenant" | "subtenant" | null;
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | null>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  const roles = [
    {
      id: "tenant" as const,
      icon: Home,
      title: "I'm listing a sublet",
      description: "I want to sublet my apartment and find a verified subtenant",
    },
    {
      id: "subtenant" as const,
      icon: Search,
      title: "I'm looking for a place",
      description: "I want to browse approved sublets and apply as a subtenant",
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
      setSubmitError("Authentication is still initializing. Please try again in a moment.");
      return;
    }

    if (!selectedRole) {
      setSubmitError("Please choose whether you're listing or looking for a place.");
      setStep(1);
      return;
    }

    if (!validate()) {
      setSubmitError(null);
      return;
    }

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
            role: selectedRole,
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
        toast.success("Account created successfully!");
        navigate("/listings");
        return;
      }

      setSubmitError("Could not complete signup. Please try again.");
    } catch (err: any) {
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

  // Duplicate account screen
  if (duplicateEmail) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Account already exists</h1>
            <p className="text-muted-foreground">
              An account with <strong className="text-foreground">{duplicateEmail}</strong> already exists. Would you like to log in instead?
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/login")} size="lg">
                Log In Instead
              </Button>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center space-y-6"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Check your inbox!</h1>
            <p className="text-muted-foreground">
              We sent a verification link to <strong className="text-foreground">{email}</strong>.
              Click the link in the email to activate your account.
            </p>
            <p className="text-xs text-muted-foreground">
              Don't see it? Check your <strong>spam or junk folder</strong>. It may take a minute to arrive.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => handleResendVerification(email)} disabled={resending || resendCooldown > 0} variant="outline" size="lg">
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Email"}
              </Button>
              <button
                onClick={() => {
                  setEmailSent(false);
                  setStep(2);
                }}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Wrong email address? ← Go back
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {step === 1 ? "How will you use SubIn?" : "Enter your details to get started"}
            </p>
          </div>

          {step === 1 && (
            <div className="mt-8 space-y-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setStep(2);
                  }}
                  className={cn(
                    "group w-full rounded-xl border-2 p-5 sm:p-6 text-left transition-all hover:border-primary hover:bg-accent/50",
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
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="mt-1.5 h-12"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); }}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-destructive">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      className="mt-1.5 h-12"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); }}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-destructive">{errors.lastName}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-10 h-12"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      className="pr-10 h-12"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-1 text-sm text-destructive">{errors.password}</p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Must be at least 6 characters</p>
                  )}
                </div>
                {/* Terms checkbox */}
                <div className="space-y-1">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="signup-terms"
                      checked={agreedToTerms}
                      onCheckedChange={(v) => { setAgreedToTerms(v === true); setErrors((p) => ({ ...p, terms: undefined })); }}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
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
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </div>
                )}
                <Button
                  className="w-full h-12"
                  size="lg"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    ← Change role
                  </button>
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
