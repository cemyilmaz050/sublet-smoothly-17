import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, ArrowRight, Loader2, Home, Search, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthModal } from "@/hooks/useAuthModal";
import { cn } from "@/lib/utils";

const AuthModal = () => {
  const { isOpen, closeAuthModal, executePendingAction } = useAuthModal();
  const [tab, setTab] = useState<"login" | "signup">("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Signup state
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const resetState = () => {
    setLoginEmail(""); setLoginPassword(""); setLoginErrors({});
    setSelectedRole(null); setFirstName(""); setLastName("");
    setSignupEmail(""); setPhone(""); setSignupPassword("");
    setSignupErrors({}); setEmailSent(false); setResendCooldown(0);
    setForgotMode(false); setForgotEmail(""); setForgotSent(false);
    setTab("login");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      closeAuthModal();
      resetState();
    }
  };

  const handleLogin = async () => {
    const e: { email?: string; password?: string } = {};
    if (!loginEmail.trim()) e.email = "Email is required";
    if (!loginPassword) e.password = "Password is required";
    setLoginErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Please confirm your email before logging in.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.session) {
        toast.success("Logged in successfully!");
        executePendingAction();
        resetState();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignUp = async () => {
    const errs: Record<string, string> = {};
    if (!selectedRole) errs.role = "Please choose your role";
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!signupEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) errs.email = "Invalid email";
    if (!signupPassword) errs.password = "Password is required";
    else if (signupPassword.length < 6) errs.password = "Minimum 6 characters";
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSignupLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { first_name: firstName, last_name: lastName, phone, role: selectedRole },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already exists")) {
          toast.error("This email is already registered. Try logging in.");
          setTab("login");
          setLoginEmail(signupEmail);
          return;
        }
        toast.error(error.message);
        return;
      }

      // Check for fake signup (duplicate with no identities)
      const identities = data.user?.identities ?? [];
      if (data.user && !data.session && identities.length === 0) {
        toast.error("This email is already registered. Try logging in.");
        setTab("login");
        setLoginEmail(signupEmail);
        return;
      }

      if (data.user && !data.session) {
        setEmailSent(true);
        toast.success("Check your email to verify your account!");
        return;
      }

      if (data.session) {
        toast.success("Account created!");
        executePendingAction();
        resetState();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) { toast.error("Please enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setForgotSent(true);
    setForgotLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {forgotMode ? "Reset Password" : emailSent ? "Check Your Email" : "Welcome to SubletSafe"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {forgotMode
                ? "We'll send you a reset link"
                : emailSent
                ? "Verify your email to continue"
                : "Sign in or create an account to continue"}
            </p>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Email sent confirmation */}
          {emailSent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <strong className="text-foreground">{signupEmail}</strong>.
                Click the link to activate your account, then come back here.
              </p>
              <Button variant="outline" onClick={() => { setEmailSent(false); setTab("login"); setLoginEmail(signupEmail); }}>
                I've verified — Log in
              </Button>
            </div>
          ) : forgotMode ? (
            /* Forgot password */
            forgotSent ? (
              <div className="text-center space-y-4 py-4">
                <Mail className="mx-auto h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reset link sent to <strong className="text-foreground">{forgotEmail}</strong>.
                </p>
                <Button variant="outline" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                  ← Back to login
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email" placeholder="john@example.com" className="mt-1.5"
                    value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
                  />
                </div>
                <Button className="w-full" onClick={handleForgotPassword} disabled={forgotLoading}>
                  {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <button onClick={() => setForgotMode(false)} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  ← Back to login
                </button>
              </div>
            )
          ) : (
            /* Login / Signup tabs */
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email" placeholder="john@example.com" className="pl-10"
                        value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); }}
                      />
                    </div>
                    {loginErrors.email && <p className="mt-1 text-sm text-destructive">{loginErrors.email}</p>}
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>Password</Label>
                      <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(loginEmail); }} className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      type="password" placeholder="Enter your password" className="mt-1.5"
                      value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); }}
                    />
                    {loginErrors.password && <p className="mt-1 text-sm text-destructive">{loginErrors.password}</p>}
                  </div>
                  <Button className="w-full" size="lg" type="submit" disabled={loginLoading}>
                    {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" className="mt-0">
                <div className="space-y-4">
                  {/* Role selection */}
                  <div>
                    <Label className="mb-2 block">I am a...</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "tenant" as const, icon: Home, label: "Current Tenant", desc: "Sublet my place" },
                        { id: "subtenant" as const, icon: Search, label: "Looking for a place", desc: "Browse & apply" },
                      ]).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setSelectedRole(r.id); setSignupErrors((p) => ({ ...p, role: "" })); }}
                          className={cn(
                            "rounded-lg border-2 p-3 text-left transition-all hover:border-primary",
                            selectedRole === r.id ? "border-primary bg-accent/50" : "border-border"
                          )}
                        >
                          <r.icon className="h-4 w-4 text-primary mb-1" />
                          <p className="text-sm font-semibold text-foreground">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                    {signupErrors.role && <p className="mt-1 text-sm text-destructive">{signupErrors.role}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>First Name</Label>
                      <Input placeholder="John" className="mt-1.5" value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setSignupErrors((p) => ({ ...p, firstName: "" })); }} />
                      {signupErrors.firstName && <p className="mt-1 text-sm text-destructive">{signupErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" className="mt-1.5" value={lastName}
                        onChange={(e) => { setLastName(e.target.value); setSignupErrors((p) => ({ ...p, lastName: "" })); }} />
                      {signupErrors.lastName && <p className="mt-1 text-sm text-destructive">{signupErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="john@example.com" className="pl-10" value={signupEmail}
                        onChange={(e) => { setSignupEmail(e.target.value); setSignupErrors((p) => ({ ...p, email: "" })); }} />
                    </div>
                    {signupErrors.email && <p className="mt-1 text-sm text-destructive">{signupErrors.email}</p>}
                  </div>

                  <div>
                    <Label>Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="tel" placeholder="+1 (555) 000-0000" className="pl-10" value={phone}
                        onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label>Password</Label>
                    <Input type="password" placeholder="Create a password (6+ chars)" className="mt-1.5" value={signupPassword}
                      onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors((p) => ({ ...p, password: "" })); }} />
                    {signupErrors.password && <p className="mt-1 text-sm text-destructive">{signupErrors.password}</p>}
                  </div>

                  <Button className="w-full" size="lg" onClick={handleSignUp} disabled={signupLoading}>
                    {signupLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
