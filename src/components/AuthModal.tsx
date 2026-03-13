import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, ArrowRight, Loader2, Home, Search, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuthModal } from "@/hooks/useAuthModal";
import { cn } from "@/lib/utils";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

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
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  

  const handleGoogleSignIn = async () => {
    // Don't set loading state BEFORE the OAuth call — setting state triggers
    // a React re-render which breaks the browser's "user gesture" chain,
    // causing the popup to be blocked and showing "Sign in was cancelled".
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result?.error) {
        toast.error(result.error.message || "Google sign-in failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    }
  };

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
          toast.error("Please confirm your email before logging in. Check your inbox and spam folder.", {
            action: {
              label: "Resend",
              onClick: async () => {
                const { error: resendErr } = await supabase.auth.resend({ type: "signup", email: loginEmail });
                if (resendErr) toast.error(resendErr.message);
                else toast.success("Verification email resent!");
              },
            },
          });
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

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: signupEmail });
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
              {forgotMode ? "Reset Password" : emailSent ? "Check Your Email" : "Welcome to SubIn"}
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
              <p className="text-xs text-muted-foreground">
                Don't see it? Check your <strong>spam or junk folder</strong>. It may take a minute to arrive.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={resending || resendCooldown > 0}
                >
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                </Button>
                <Button variant="outline" onClick={() => { setEmailSent(false); setTab("login"); setLoginEmail(signupEmail); }}>
                  I've verified — Log in
                </Button>
              </div>
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
              <TabsContent value="login" className="mt-0 space-y-4">
                <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn}>
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                </div>
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
              <TabsContent value="signup" className="mt-0 space-y-4">
                <Button variant="outline" className="w-full" size="lg" onClick={handleGoogleSignIn}>
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                </div>
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
