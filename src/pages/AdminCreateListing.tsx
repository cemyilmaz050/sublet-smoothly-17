import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft, Search, User, Globe, Copy, Upload, Plus, Loader2,
  CheckCircle2, AlertCircle, Home, FileSpreadsheet, X, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { AMENITIES_LIST, PROPERTY_TYPES, GUEST_POLICIES } from "@/types/listing";

const FOUNDER_IDS = ["370d6445-15bc-4802-8626-1507c38fbdd4"];

interface SelectedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface ListingForm {
  address: string;
  unit_number: string;
  property_type: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  headline: string;
  description: string;
  monthly_rent: string;
  security_deposit: string;
  available_from: string;
  available_until: string;
  amenities: string[];
  house_rules: string;
  guest_policy: string;
  photoUrls: string[];
}

const emptyForm: ListingForm = {
  address: "",
  unit_number: "",
  property_type: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  headline: "",
  description: "",
  monthly_rent: "",
  security_deposit: "",
  available_from: "",
  available_until: "",
  amenities: [],
  house_rules: "",
  guest_policy: "",
  photoUrls: [],
};

const AdminCreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFounder = user && FOUNDER_IDS.includes(user.id);

  const [activeTab, setActiveTab] = useState("single");
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<SelectedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // CSV state
  const [csvEmail, setCsvEmail] = useState("");
  const [csvUser, setCsvUser] = useState<SelectedUser | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; success: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Duplicate state
  const [dupListingId, setDupListingId] = useState("");
  const [dupUnit, setDupUnit] = useState("");
  const [dupRent, setDupRent] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  if (!isFounder) return null;

  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: { action: "list_users", search: userSearch.trim() },
      });
      if (error) throw error;
      setUserResults(data?.users || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to search users");
    } finally {
      setSearchingUsers(false);
    }
  };

  const lookupUser = async (email: string): Promise<SelectedUser | null> => {
    const { data, error } = await supabase.functions.invoke("admin-create-listing", {
      body: { action: "lookup_user", email: email.trim() },
    });
    if (error || data?.error) {
      toast.error(data?.error || "User not found");
      return null;
    }
    return { id: data.user_id, email: data.email, first_name: data.first_name, last_name: data.last_name };
  };

  const handleScrape = async () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-property", {
        body: { url: scrapeUrl.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const d = data.data;
      setForm((prev) => ({
        ...prev,
        address: d.address || prev.address,
        headline: d.headline || prev.headline,
        description: d.description || prev.description,
        bedrooms: d.bedrooms != null ? String(d.bedrooms) : prev.bedrooms,
        bathrooms: d.bathrooms != null ? String(d.bathrooms) : prev.bathrooms,
        sqft: d.sqft != null ? String(d.sqft) : prev.sqft,
        monthly_rent: d.monthly_rent != null ? String(d.monthly_rent) : prev.monthly_rent,
        photoUrls: d.photos?.length > 0 ? d.photos : prev.photoUrls,
        amenities: d.amenities?.length > 0 ? d.amenities : prev.amenities,
      }));
      toast.success(`Imported ${d.photos?.length || 0} photos and property details`);
    } catch (err: any) {
      toast.error(err.message || "Failed to scrape property");
    } finally {
      setScraping(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first");
      return;
    }
    if (!form.address.trim()) {
      toast.error("Address is required");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: {
          action: "create_listing",
          tenant_id: selectedUser.id,
          listing: {
            ...form,
            bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
            bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            sqft: form.sqft ? Number(form.sqft) : null,
            monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : null,
            security_deposit: form.security_deposit ? Number(form.security_deposit) : null,
            photos: form.photoUrls,
            status: "active",
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSavedId(data.listing_id);
      toast.success(`Listing created for ${selectedUser.email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!dupListingId.trim()) {
      toast.error("Enter a listing ID to duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const overrides: Record<string, any> = {};
      if (dupUnit.trim()) overrides.unit_number = dupUnit.trim();
      if (dupRent.trim()) overrides.monthly_rent = Number(dupRent);

      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: { action: "duplicate_listing", listing_id: dupListingId.trim(), overrides },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Listing duplicated! New ID: ${data.listing_id}`);
      setDupListingId("");
      setDupUnit("");
      setDupRent("");
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate listing");
    } finally {
      setDuplicating(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        toast.error("CSV must have a header row and at least one data row");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const rows: Record<string, string>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }
      setCsvData(rows);
      toast.success(`Loaded ${rows.length} listings from CSV`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkCreate = async () => {
    if (!csvUser) {
      toast.error("Please look up a user first");
      return;
    }
    if (csvData.length === 0) {
      toast.error("No CSV data loaded");
      return;
    }
    setBulkSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: {
          action: "bulk_create",
          tenant_id: csvUser.id,
          listings: csvData,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBulkResult({ total: data.total, success: data.success_count });
      toast.success(`${data.success_count}/${data.total} listings created`);
    } catch (err: any) {
      toast.error(err.message || "Bulk creation failed");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleCsvUserLookup = async () => {
    const u = await lookupUser(csvEmail);
    if (u) setCsvUser(u);
  };

  const removePhoto = (index: number) => {
    setForm((prev) => ({
      ...prev,
      photoUrls: prev.photoUrls.filter((_, i) => i !== index),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedUser(null);
    setUserSearch("");
    setUserResults([]);
    setSavedId(null);
    setScrapeUrl("");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin-subin-2026")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Listing for User</h1>
            <p className="text-sm text-muted-foreground">Create, import, duplicate, or bulk upload listings on behalf of any subletter</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Single
            </TabsTrigger>
            <TabsTrigger value="duplicate" className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Bulk CSV
            </TabsTrigger>
          </TabsList>

          {/* === SINGLE LISTING === */}
          <TabsContent value="single" className="space-y-6 mt-6">
            {savedId ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <CheckCircle2 className="h-12 w-12 text-emerald" />
                  <h2 className="text-lg font-bold text-foreground">Listing Created!</h2>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    The listing has been created under {selectedUser?.email}'s account. They've been notified and can review/edit it.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetForm}>Create Another</Button>
                    <Button onClick={() => navigate("/admin-subin-2026")}>Back to Dashboard</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Step 1: Select User */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-primary" />
                      Step 1: Select Subletter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser ? (
                      <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5">
                        <div>
                          <p className="text-sm font-medium">{selectedUser.first_name} {selectedUser.last_name}</p>
                          <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search by name or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                          />
                          <Button onClick={searchUsers} disabled={searchingUsers} size="sm">
                            {searchingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                          </Button>
                        </div>
                        {userResults.length > 0 && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {userResults.map((u) => (
                              <button
                                key={u.id}
                                onClick={() => { setSelectedUser(u); setUserResults([]); }}
                                className="w-full text-left rounded-lg border p-2.5 hover:bg-accent transition-colors"
                              >
                                <p className="text-sm font-medium">{u.first_name} {u.last_name || ""}</p>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Step 2: Import from URL */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4 text-primary" />
                      Import from Zillow / Property URL (Optional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Paste a Zillow, Apartments.com, or any property listing URL to auto-fill details and photos.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://www.zillow.com/homedetails/..."
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                      />
                      <Button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} size="sm">
                        {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                        <span className="ml-1.5 hidden sm:inline">{scraping ? "Importing..." : "Import"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3: Listing Details */}
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Home className="h-4 w-4 text-primary" />
                      Listing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Address *</Label>
                        <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Boston, MA" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit Number</Label>
                        <Input value={form.unit_number} onChange={(e) => setForm((p) => ({ ...p, unit_number: e.target.value }))} placeholder="Apt 2B" />
                      </div>
                      <div>
                        <Label className="text-xs">Property Type</Label>
                        <Select value={form.property_type} onValueChange={(v) => setForm((p) => ({ ...p, property_type: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Bedrooms</Label>
                        <Input type="number" value={form.bedrooms} onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Bathrooms</Label>
                        <Input type="number" value={form.bathrooms} onChange={(e) => setForm((p) => ({ ...p, bathrooms: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Sq Ft</Label>
                        <Input type="number" value={form.sqft} onChange={(e) => setForm((p) => ({ ...p, sqft: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Monthly Rent ($)</Label>
                        <Input type="number" value={form.monthly_rent} onChange={(e) => setForm((p) => ({ ...p, monthly_rent: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Security Deposit ($)</Label>
                        <Input type="number" value={form.security_deposit} onChange={(e) => setForm((p) => ({ ...p, security_deposit: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Available From</Label>
                        <Input type="date" value={form.available_from} onChange={(e) => setForm((p) => ({ ...p, available_from: e.target.value }))} />
                      </div>
                      <div>
                        <Label className="text-xs">Available Until</Label>
                        <Input type="date" value={form.available_until} onChange={(e) => setForm((p) => ({ ...p, available_until: e.target.value }))} />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <Label className="text-xs">Headline</Label>
                      <Input value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} placeholder="Sunny 2BR in Back Bay" />
                    </div>

                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} placeholder="Describe the property..." />
                    </div>

                    <div>
                      <Label className="text-xs">Guest Policy</Label>
                      <Select value={form.guest_policy} onValueChange={(v) => setForm((p) => ({ ...p, guest_policy: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {GUEST_POLICIES.map((g) => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">House Rules</Label>
                      <Textarea value={form.house_rules} onChange={(e) => setForm((p) => ({ ...p, house_rules: e.target.value }))} rows={2} placeholder="No smoking, quiet hours after 10pm..." />
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Amenities</Label>
                      <div className="flex flex-wrap gap-3">
                        {AMENITIES_LIST.map((a) => (
                          <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <Checkbox
                              checked={form.amenities.includes(a)}
                              onCheckedChange={(checked) => {
                                setForm((p) => ({
                                  ...p,
                                  amenities: checked ? [...p.amenities, a] : p.amenities.filter((x) => x !== a),
                                }));
                              }}
                            />
                            {a}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Photo URLs */}
                    <div>
                      <Label className="text-xs mb-2 block">Photos ({form.photoUrls.length})</Label>
                      {form.photoUrls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {form.photoUrls.map((url, i) => (
                            <div key={i} className="relative group">
                              <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border" />
                              <button
                                onClick={() => removePhoto(i)}
                                className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <Input
                        placeholder="Add photo URL and press Enter"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) {
                              setForm((p) => ({ ...p, photoUrls: [...p.photoUrls, val] }));
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSave} disabled={saving || !selectedUser} size="lg">
                        {saving ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                        ) : (
                          <><Plus className="mr-2 h-4 w-4" /> Create Listing</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* === DUPLICATE === */}
          <TabsContent value="duplicate" className="space-y-6 mt-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Copy className="h-4 w-4 text-primary" />
                  Duplicate Existing Listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Duplicate a listing and just change the unit number and/or rent. Useful for multiple units in the same building.
                </p>
                <div>
                  <Label className="text-xs">Listing ID to Duplicate</Label>
                  <Input
                    value={dupListingId}
                    onChange={(e) => setDupListingId(e.target.value)}
                    placeholder="Paste the listing UUID..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">New Unit Number</Label>
                    <Input value={dupUnit} onChange={(e) => setDupUnit(e.target.value)} placeholder="Apt 3A" />
                  </div>
                  <div>
                    <Label className="text-xs">New Monthly Rent ($)</Label>
                    <Input type="number" value={dupRent} onChange={(e) => setDupRent(e.target.value)} placeholder="2500" />
                  </div>
                </div>
                <Button onClick={handleDuplicate} disabled={duplicating || !dupListingId.trim()}>
                  {duplicating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Duplicating...</> : <><Copy className="mr-2 h-4 w-4" /> Duplicate Listing</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === BULK CSV === */}
          <TabsContent value="bulk" className="space-y-6 mt-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Bulk Upload via CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Upload a CSV with columns: address, unit_number, property_type, bedrooms, bathrooms, sqft, headline, description, monthly_rent, security_deposit, available_from, available_until, amenities, guest_policy, house_rules.
                  All listings will be created under the selected user's account.
                </p>

                <div className="flex gap-2">
                  <Input
                    placeholder="User email for all listings..."
                    value={csvEmail}
                    onChange={(e) => setCsvEmail(e.target.value)}
                  />
                  <Button size="sm" onClick={handleCsvUserLookup} disabled={!csvEmail.trim()}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {csvUser && (
                  <div className="flex items-center gap-2 rounded-lg border p-2.5 bg-primary/5">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm">{csvUser.first_name} {csvUser.last_name} — {csvUser.email}</span>
                  </div>
                )}

                <div>
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvUpload} className="hidden" />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload CSV
                  </Button>
                </div>

                {csvData.length > 0 && (
                  <>
                    <div className="rounded-lg border p-3 bg-muted/50">
                      <p className="text-sm font-medium">{csvData.length} listings loaded</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Preview: {csvData.slice(0, 3).map((r) => r.address || r.headline || "—").join(", ")}
                        {csvData.length > 3 && ` +${csvData.length - 3} more`}
                      </p>
                    </div>

                    <Button onClick={handleBulkCreate} disabled={bulkSaving || !csvUser}>
                      {bulkSaving ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating {csvData.length} listings...</>
                      ) : (
                        <><Plus className="mr-2 h-4 w-4" /> Create {csvData.length} Listings</>
                      )}
                    </Button>
                  </>
                )}

                {bulkResult && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald/10 p-3 text-sm text-emerald">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{bulkResult.success}/{bulkResult.total} listings created successfully</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminCreateListing;
