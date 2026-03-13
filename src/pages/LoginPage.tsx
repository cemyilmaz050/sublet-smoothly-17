import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Mail, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginErrorType, setLoginErrorType] = useState<"credentials" | "unconfirmed" | "generic" | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  const validate = () => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address";
    if (!password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setLoginError(null);
    setLoginErrorType(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setLoginError("Incorrect email or password. Please try again.");
          setLoginErrorType("credentials");
        } else if (error.message.includes("Email not confirmed")) {
          setLoginError("Your email hasn't been verified yet. Check your inbox for the verification link.");
          setLoginErrorType("unconfirmed");
        } else {
          setLoginError(error.message);
          setLoginErrorType("generic");
        }
        return;
      }
      if (data.session) {
        toast.success("Logged in successfully!");
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setLoginError(err.message || "An unexpected error occurred. Please try again.");
      setLoginErrorType("generic");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) toast.error(error.message);
    else toast.success("Verification email resent! Check your inbox.");
  };

  const handleDemoLogin = async () => {
    setEmail("demo@bostonbrokerage.com");
    setPassword("demo123456");
    setLoading(true);
    setLoginError(null);
    setLoginErrorType(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "demo@bostonbrokerage.com",
        password: "demo123456",
      });
      if (error) {
        toast.error("Demo account not available. Please contact support.");
        return;
      }
      if (data.session) {
        toast.success("Logged in as Boston Brokerage Group staff!");
        navigate("/manager", { replace: true });
      }
    } catch {
      toast.error("Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address");
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setForgotError(error.message);
        return;
      }
      setForgotSent(true);
    } catch (err: any) {
      setForgotError(err.message || "Failed to send reset email");
    } finally {
      setForgotLoading(false);
    }
  };

  if (forgotMode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-card">
              {forgotSent ? (
                <div className="text-center space-y-4">
                  <Mail className="mx-auto h-12 w-12 text-primary" />
                  <h2 className="mt-4 text-2xl font-bold text-foreground">Check your inbox</h2>
                  <p className="text-muted-foreground">
                    We sent a password reset link to <strong className="text-foreground">{forgotEmail}</strong>.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't see it? Check your <strong>spam or junk folder</strong>. It may take a minute.
                  </p>
                  <Button variant="outline" className="mt-4 h-12" onClick={() => { setForgotMode(false); setForgotSent(false); }}>
                    ← Back to login
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
                  <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword(); }} className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="john@example.com"
                        className="mt-1.5 h-12"
                        autoComplete="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(null); }}
                      />
                      {forgotError && <p className="mt-1 text-sm text-destructive">{forgotError}</p>}
                    </div>
                    <Button className="w-full h-12" type="submit" disabled={forgotLoading}>
                      {forgotLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Send Reset Link
                    </Button>
                    <button type="button" onClick={() => { setForgotMode(false); setForgotError(null); }} className="w-full text-center text-sm text-muted-foreground hover:text-primary">
                      ← Back to login
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex items-center justify-center px-4 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-1 text-muted-foreground">Sign in to your SubIn account</p>
          </div>

          <div className="mt-8 rounded-xl border bg-card p-6 sm:p-8 shadow-card">
            <form
              onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
              className="space-y-4"
            >
              {/* Inline login error */}
              {loginError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive space-y-2">
                  <p>{loginError}</p>
                  {loginErrorType === "credentials" && (
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setForgotEmail(email); }}
                      className="text-xs font-medium underline hover:no-underline"
                    >
                      Reset your password
                    </button>
                  )}
                  {loginErrorType === "unconfirmed" && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="text-xs font-medium underline hover:no-underline"
                    >
                      Resend verification email
                    </button>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="login-email">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="john@example.com"
                    className="pl-10 h-12"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); setLoginError(null); }}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button type="button" onClick={() => { setForgotMode(true); setForgotEmail(email); }} className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pr-10 h-12"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); setLoginError(null); }}
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
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password}</p>}
              </div>
              <Button className="w-full h-12" size="lg" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link>
            </p>
          </div>

          {/* Demo Staff Login */}
          <Card className="mt-6 border-dashed border-2 border-primary/30 bg-primary/[0.03]">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Boston Brokerage Group — Staff Login</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Demo account for property management staff</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs h-9"
                    onClick={handleDemoLogin}
                    disabled={loading}
                  >
                    <Building2 className="mr-1.5 h-3.5 w-3.5" />
                    Log in as BBG Staff
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
