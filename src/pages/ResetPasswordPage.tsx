import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session && mounted) {
          setReady(true);
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        setReady(true);
      } else {
        const hash = window.location.hash;
        if (hash) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get("access_token");
          const type = params.get("type");
          if (accessToken || type === "recovery") return;
        }
        const timeout = setTimeout(() => {
          if (mounted && !ready) {
            toast.error("Invalid or expired reset link.");
            navigate("/login");
          }
        }, 3000);
        return () => clearTimeout(timeout);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  const handleReset = async () => {
    const e: { password?: string; confirm?: string } = {};
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) e.confirm = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSuccess(true);
      toast.success("Password updated successfully!");
      // User is already logged in after password recovery, redirect to listings
      setTimeout(() => navigate("/listings", { replace: true }), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (!ready && !success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container flex items-center justify-center px-4 py-12 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-xl border bg-card p-6 sm:p-8 shadow-card">
            {success ? (
              <div className="text-center space-y-3">
                <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Password updated!</h2>
                <p className="text-muted-foreground">Taking you to SubIn...</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground">Set a new password</h2>
                <p className="mt-1 text-sm text-muted-foreground">Enter and confirm your new password below.</p>
                <form onSubmit={(e) => { e.preventDefault(); handleReset(); }} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative mt-1.5">
                      <Input
                        id="new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
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
                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="mt-1.5 h-12"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })); }}
                    />
                    {errors.confirm && <p className="mt-1 text-sm text-destructive">{errors.confirm}</p>}
                  </div>
                  <Button className="w-full h-12" type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
