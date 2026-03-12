import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Search, Mail, Phone, ArrowRight, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

const SignUpPage = () => {
  const { user, isReady, role } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialRole = searchParams.get("role") as "tenant" | "subtenant" | null;
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | null>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Auto-redirect if already logged in
  if (isReady && user) {
    const dest = role === "subtenant" ? "/dashboard/subtenant" : role === "manager" ? "/dashboard/manager" : "/dashboard/tenant";
    return <Navigate to={dest} replace />;
  }

  const roles = [
    {
      id: "tenant" as const,
      icon: Home,
      title: "I'm a Current Tenant",
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    console.log("Sign up button clicked");
    console.log("Form values:", {
      firstName,
      lastName,
      email,
      phone,
      selectedRole,
      hasPassword: Boolean(password),
      passwordLength: password.length,
    });
    console.log("Supabase client:", supabase);

    if (!isReady) {
      setSubmitError("Authentication is still initializing. Please try again in a moment.");
      toast.info("Auth is still initializing. Please try again in a second.");
      return;
    }

    if (!selectedRole) {
      setSubmitError("Please choose whether you're a tenant or looking for a place.");
      setStep(1);
      return;
    }

    if (!validate()) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      console.log("Before supabase.auth.signUp()");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: selectedRole,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      console.log("After supabase.auth.signUp():", { data, error });

      if (error) {
        console.error("Signup error:", error);
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setSubmitError(null);
          setDuplicateEmail(email);
          return;
        }
        setSubmitError(error.message);
        toast.error(error.message);
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
        toast.success("Confirmation email sent. Please check your inbox.");
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        navigate(selectedRole === "tenant" ? "/dashboard/tenant" : "/dashboard/subtenant");
        return;
      }

      setSubmitError("Could not complete signup. Please try again.");
      toast.error("Could not complete signup. Please try again.");
    } catch (err: any) {
      console.error("Sign up error:", err);
      setSubmitError("Something went wrong. Please try again.");
      toast.error(err?.message || "Something went wrong. Please try again.");
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
        <Navbar />
        <div className="container flex items-center justify-center py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Account already exists</h1>
            <p className="text-muted-foreground">
              An account with <strong className="text-foreground">{duplicateEmail}</strong> already exists.
              If you haven't verified your email yet, check your inbox or resend the verification email.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => handleResendVerification(duplicateEmail)} disabled={resending || resendCooldown > 0}>
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Log In Instead
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
        <Navbar />
        <div className="container flex items-center justify-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center space-y-6"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Check your email!</h1>
            <p className="text-muted-foreground">
              We sent a verification link to <strong className="text-foreground">{email}</strong>.
              Click the link in the email to activate your account.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => handleResendVerification(email)} disabled={resending || resendCooldown > 0} variant="outline">
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
      <Navbar />
      <div className="container flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-muted-foreground">
              {step === 1 ? "Choose how you'll use SubletSafe" : "Enter your details to get started"}
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
                    "group w-full rounded-xl border-2 p-6 text-left transition-all hover:border-primary hover:bg-accent/50",
                    selectedRole === role.id ? "border-primary bg-accent/50" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <role.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{role.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 rounded-xl border bg-card p-8 shadow-card">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      className="mt-1.5"
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
                      className="mt-1.5"
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
                      className="pl-10"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a password"
                    className="mt-1.5"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                  />
                  {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
                </div>
                {submitError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {submitError}
                  </div>
                )}
                <Button
                  className="mt-2 w-full"
                  size="lg"
                  type="button"
                  onClick={handleSignUp}
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
                <button
                  onClick={() => setStep(1)}
                  className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-primary"
                >
                  ← Back to role selection
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
