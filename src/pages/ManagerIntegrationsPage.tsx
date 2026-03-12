import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link2, RefreshCw, CheckCircle2, AlertTriangle, Clock, Loader2, ArrowLeft, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Integration {
  id: string;
  appfolio_url: string;
  last_synced_at: string | null;
  status: string;
  sync_error: string | null;
  synced_count: number;
}

const ManagerIntegrationsPage = () => {
  const { user } = useAuth();
  const [integration, setIntegration] = useState<Integration | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("manager_integrations")
        .select("*")
        .eq("manager_id", user.id)
        .maybeSingle();
      if (data) {
        setIntegration(data as Integration);
        setUrl(data.appfolio_url);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const validateUrl = (u: string) => {
    if (!u.trim()) return "URL is required";
    if (!u.includes("appfolio.com")) return "Must be an AppFolio URL (e.g. https://your-company.appfolio.com)";
    try {
      new URL(u);
    } catch {
      return "Invalid URL format";
    }
    return "";
  };

  const handleSave = async () => {
    const err = validateUrl(url);
    if (err) {
      setUrlError(err);
      return;
    }
    setUrlError("");
    setSaving(true);

    try {
      if (integration) {
        const { error } = await supabase
          .from("manager_integrations")
          .update({ appfolio_url: url, status: "never_synced", sync_error: null })
          .eq("id", integration.id);
        if (error) throw error;
        setIntegration({ ...integration, appfolio_url: url, status: "never_synced", sync_error: null });
      } else {
        const { data, error } = await supabase
          .from("manager_integrations")
          .insert({ manager_id: user!.id, appfolio_url: url })
          .select()
          .single();
        if (error) throw error;
        setIntegration(data as Integration);
      }
      toast.success("AppFolio URL saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    if (!integration) return;
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-appfolio-public");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Synced ${data.synced} listings from AppFolio`);

      // Refresh integration data
      const { data: updated } = await supabase
        .from("manager_integrations")
        .select("*")
        .eq("id", integration.id)
        .single();
      if (updated) setIntegration(updated as Integration);
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
      // Refresh to get error state
      const { data: updated } = await supabase
        .from("manager_integrations")
        .select("*")
        .eq("id", integration.id)
        .single();
      if (updated) setIntegration(updated as Integration);
    } finally {
      setSyncing(false);
    }
  };

  const statusBadge = () => {
    if (!integration) return null;
    switch (integration.status) {
      case "connected":
        return <Badge variant="emerald"><CheckCircle2 className="mr-1 h-3 w-3" />Connected</Badge>;
      case "error":
        return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Error</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Never Synced</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <Button variant="ghost" className="mb-4" asChild>
          <a href="/dashboard/manager">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </a>
        </Button>

        <h1 className="text-2xl font-bold text-foreground">Settings → Integrations</h1>
        <p className="mt-1 mb-6 text-muted-foreground">Connect external property management tools</p>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">AppFolio Connection</CardTitle>
                  <p className="text-sm text-muted-foreground">Sync listings from your AppFolio account</p>
                </div>
              </div>
              {statusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="appfolio-url">AppFolio Listings URL</Label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="appfolio-url"
                    placeholder="https://your-company.appfolio.com"
                    className="pl-10"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
              {urlError && <p className="mt-1 text-sm text-destructive">{urlError}</p>}
            </div>

            {integration && (
              <>
                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{integration.synced_count}</p>
                    <p className="text-xs text-muted-foreground">Properties Synced</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-sm font-medium text-foreground">
                      {integration.last_synced_at
                        ? format(new Date(integration.last_synced_at), "MMM d, h:mm a")
                        : "Never"}
                    </p>
                    <p className="text-xs text-muted-foreground">Last Synced</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button onClick={handleSync} disabled={syncing} className="w-full">
                      {syncing ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1 h-4 w-4" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {integration.sync_error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Sync Error</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{integration.sync_error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border bg-accent/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Auto-sync:</strong> Listings are automatically synced every 12 hours. 
                    You can also trigger a manual sync at any time using the button above.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerIntegrationsPage;
