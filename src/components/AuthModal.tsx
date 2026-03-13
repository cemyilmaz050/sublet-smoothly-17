import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, ArrowRight, Loader2, Home, Search, CheckCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useAuthModal } from "@/hooks/useAuthModal";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

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
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorType, setLoginErrorType] = useState<"credentials" | "unconfirmed" | "generic" | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup state
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Forgot password
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
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
    setLoginEmail(""); setLoginPassword(""); setLoginErrors({}); setLoginError(null); setLoginErrorType(null); setShowLoginPassword(false);
    setSelectedRole(null); setFirstName(""); setLastName("");
    setSignupEmail(""); setSignupPassword("");
    setSignupErrors({}); setEmailSent(false); setResendCooldown(0); setShowSignupPassword(false);
    setAgreedToTerms(false);
    setForgotMode(false); setForgotEmail(""); setForgotSent(false); setForgotError(null);
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
    setLoginError(null);
    setLoginErrorType(null);
    if (Object.keys(e).length > 0) return;

    setLoginLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Incorrect email or password. Please try again.");
          setLoginErrorType("credentials");
        } else if (error.message.includes("Email not confirmed")) {
          setLoginError("Your email hasn't been verified yet. Check your inbox.");
          setLoginErrorType("unconfirmed");
        } else {
          setLoginError(error.message);
          setLoginErrorType("generic");
        }
        return;
      }
      if (data.session) {
        toast.success("Logged in successfully!");
        executePendingAction();
        resetState();
      }
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred");
      setLoginErrorType("generic");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResendFromLogin = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email: loginEmail });
    if (error) toast.error(error.message);
    else toast.success("Verification email resent!");
  };

  const handleSignUp = async () => {
    const errs: Record<string, string> = {};
    if (!selectedRole) errs.role = "Please choose your role";
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!signupEmail.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) errs.email = "Please enter a valid email";
    if (!signupPassword) errs.password = "Password is required";
    else if (signupPassword.length < 6) errs.password = "Must be at least 6 characters";
    if (!agreedToTerms) errs.terms = "You must agree to the Terms and Privacy Policy";
    setSignupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSignupLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { first_name: firstName, last_name: lastName, role: selectedRole },
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

      const identities = data.user?.identities ?? [];
      if (data.user && !data.session && identities.length === 0) {
        toast.error("This email is already registered. Try logging in.");
        setTab("login");
        setLoginEmail(signupEmail);
        return;
      }

      if (data.user && !data.session) {
        setEmailSent(true);
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
    setForgotError(null);
    if (!forgotEmail.trim()) { setForgotError("Please enter your email"); return; }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setForgotError(error.message);
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
      toast.success("Verification email resent!");
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
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 border-b px-5 sm:px-6 py-4 sm:py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {forgotMode ? "Reset Password" : emailSent ? "Check Your Email" : "Welcome to SubIn"}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {forgotMode
                ? "We'll send you a reset link"
                : emailSent
                ? "Verify your email to continue"
                : "Sign in or create an account to continue"}
            </p>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {/* Email sent confirmation */}
          {emailSent ? (
            <div className="text-center space-y-4 py-2">
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <strong className="text-foreground">{signupEmail}</strong>.
                Click the link to activate your account, then come back here.
              </p>
              <p className="text-xs text-muted-foreground">
                Don't see it? Check your <strong>spam or junk folder</strong>.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleResendVerification}
                  disabled={resending || resendCooldown > 0}
                >
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
                </Button>
                <Button variant="outline" className="h-12" onClick={() => { setEmailSent(false); setTab("login"); setLoginEmail(signupEmail); }}>
                  I've verified — Log in
                </Button>
              </div>
            </div>
          ) : forgotMode ? (
            forgotSent ? (
              <div className="text-center space-y-4 py-2">
                <Mail className="mx-auto h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Reset link sent to <strong className="text-foreground">{forgotEmail}</strong>.
                </p>
                <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
                <Button variant="outline" className="h-12" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                  ← Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email" placeholder="john@example.com" className="mt-1.5 h-12"
                    autoComplete="email"
                    value={forgotEmail} onChange={(e) => { setForgotEmail(e.target.value); setForgotError(null); }}
                  />
                  {forgotError && <p className="mt-1 text-sm text-destructive">{forgotError}</p>}
                </div>
                <Button className="w-full h-12" type="submit" disabled={forgotLoading}>
                  {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <button type="button" onClick={() => { setForgotMode(false); setForgotError(null); }} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                  ← Back to login
                </button>
              </form>
            )
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="login">Log In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login" className="mt-0 space-y-4">
                <Button variant="outline" className="w-full h-12" size="lg" onClick={handleGoogleSignIn}>
                  <GoogleIcon />
                  Continue with Google
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
                </div>

                {/* Inline login error */}
                {loginError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive space-y-1">
                    <p>{loginError}</p>
                    {loginErrorType === "credentials" && (
                      <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(loginEmail); }} className="text-xs font-medium underline hover:no-underline">
                        Reset your password
                      </button>
                    )}
                    {loginErrorType === "unconfirmed" && (
                      <button type="button" onClick={handleResendFromLogin} className="text-xs font-medium underline hover:no-underline">
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="email" placeholder="john@example.com" className="pl-10 h-12"
                        autoComplete="email"
                        value={loginEmail} onChange={(e) => { setLoginEmail(e.target.value); setLoginErrors((p) => ({ ...p, email: undefined })); setLoginError(null); }}
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
                    <div className="relative mt-1.5">
                      <Input
                        type={showLoginPassword ? "text" : "password"} placeholder="Enter your password" className="pr-10 h-12"
                        autoComplete="current-password"
                        value={loginPassword} onChange={(e) => { setLoginPassword(e.target.value); setLoginErrors((p) => ({ ...p, password: undefined })); setLoginError(null); }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginErrors.password && <p className="mt-1 text-sm text-destructive">{loginErrors.password}</p>}
                  </div>
                  <Button className="w-full h-12" size="lg" type="submit" disabled={loginLoading}>
                    {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="ml-1 h-4 w-4" /></>}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup" className="mt-0 space-y-4">
                <Button variant="outline" className="w-full h-12" size="lg" onClick={handleGoogleSignIn}>
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
                    <Label className="mb-2 block">I am...</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: "tenant" as const, icon: Home, label: "Listing a sublet", desc: "Sublet my place" },
                        { id: "subtenant" as const, icon: Search, label: "Looking for a place", desc: "Browse & apply" },
                      ]).map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setSelectedRole(r.id); setSignupErrors((p) => ({ ...p, role: "" })); }}
                          className={cn(
                            "rounded-lg border-2 p-3 text-left transition-all hover:border-primary min-h-[48px]",
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
                      <Input placeholder="John" className="mt-1.5 h-12" autoComplete="given-name" value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setSignupErrors((p) => ({ ...p, firstName: "" })); }} />
                      {signupErrors.firstName && <p className="mt-1 text-sm text-destructive">{signupErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" className="mt-1.5 h-12" autoComplete="family-name" value={lastName}
                        onChange={(e) => { setLastName(e.target.value); setSignupErrors((p) => ({ ...p, lastName: "" })); }} />
                      {signupErrors.lastName && <p className="mt-1 text-sm text-destructive">{signupErrors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Email</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input type="email" placeholder="john@example.com" className="pl-10 h-12" autoComplete="email" value={signupEmail}
                        onChange={(e) => { setSignupEmail(e.target.value); setSignupErrors((p) => ({ ...p, email: "" })); }} />
                    </div>
                    {signupErrors.email && <p className="mt-1 text-sm text-destructive">{signupErrors.email}</p>}
                  </div>

                  <div>
                    <Label>Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        type={showSignupPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className="pr-10 h-12"
                        autoComplete="new-password"
                        value={signupPassword}
                        onChange={(e) => { setSignupPassword(e.target.value); setSignupErrors((p) => ({ ...p, password: "" })); }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {signupErrors.password ? (
                      <p className="mt-1 text-sm text-destructive">{signupErrors.password}</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Must be at least 6 characters</p>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="modal-signup-terms"
                        checked={agreedToTerms}
                        onCheckedChange={(v) => { setAgreedToTerms(v === true); setSignupErrors((p) => ({ ...p, terms: "" })); }}
                        className="mt-0.5 h-4 w-4 shrink-0"
                      />
                      <label htmlFor="modal-signup-terms" className="text-sm leading-relaxed text-muted-foreground cursor-pointer">
                        I agree to the{" "}
                        <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">Terms of Service</Link>
                        {" "}and{" "}
                        <Link to="/privacy" target="_blank" className="text-primary hover:underline font-medium">Privacy Policy</Link>
                      </label>
                    </div>
                    {signupErrors.terms && <p className="ml-7 text-sm text-destructive">{signupErrors.terms}</p>}
                  </div>

                  <Button className="w-full h-12" size="lg" onClick={handleSignUp} disabled={signupLoading}>
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
