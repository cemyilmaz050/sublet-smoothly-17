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

    if (!isReady) {
      toast.info("Auth is still initializing. Please try again in a second.");
      return;
    }

    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: selectedRole || "tenant",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          setDuplicateEmail(email);
          return;
        }
        toast.error(error.message);
        return;
      }

      // Supabase returns an obfuscated success for existing users (user_repeated_signup)
      const identities = data.user?.identities ?? [];
      const isRepeatedSignup = data.user && !data.session && identities.length === 0;
      if (isRepeatedSignup) {
        setDuplicateEmail(email);
        return;
      }

      // If email confirmation is required, user won't have a session yet
      if (data.user && !data.session) {
        setEmailSent(true);
        toast.success("Confirmation email sent. Please check your inbox.");
        return;
      }

      // If auto-confirm is on, user is logged in immediately
      if (data.session) {
        toast.success("Account created successfully!");
        const role = selectedRole || "tenant";
        navigate(role === "tenant" ? "/dashboard/tenant" : "/dashboard/subtenant");
        return;
      }

      toast.error("Could not complete signup. Please try again.");
    } catch (err: any) {
      console.error("Unexpected signup error:", err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex items-center justify-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-foreground">Check your email</h1>
            <p className="mt-3 text-muted-foreground">
              We've sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              Please click the link to verify your account and get started.
            </p>
            <Button
              variant="outline"
              className="mt-8"
              onClick={() => {
                setEmailSent(false);
                setStep(2);
              }}
            >
              ← Back to sign up
            </Button>
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
                <Button
                  className="mt-2 w-full"
                  size="lg"
                  onClick={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
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
