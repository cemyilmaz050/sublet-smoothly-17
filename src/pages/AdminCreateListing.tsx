import { useState, useRef, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, ArrowRight, Search, User, Globe, Copy, Upload, Plus, Loader2,
  CheckCircle2, Home, FileSpreadsheet, X, ExternalLink, Sparkles, Eye,
  DollarSign, Calendar, ShieldCheck, BookOpen, ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { AMENITIES_LIST, PROPERTY_TYPES, GUEST_POLICIES } from "@/types/listing";
import UniversalPhotoUploader from "@/components/UniversalPhotoUploader";

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
  floor: string;
  building_name: string;
  space_type: string;
  sqft: string;
  headline: string;
  description: string;
  monthly_rent: string;
  security_deposit: string;
  available_from: string;
  available_until: string;
  instant_available: boolean;
  utilities_included: boolean;
  amenities: string[];
  nearby_landmarks: string[];
  house_rules: string;
  guest_policy: string;
  no_smoking: boolean;
  pets_allowed: boolean;
  no_parties: boolean;
  quiet_hours: boolean;
  custom_rules: string;
  photoUrls: string[];
  is_bbg: boolean;
  catalog_unit_id: string;
}

const emptyForm: ListingForm = {
  address: "", unit_number: "", property_type: "", bedrooms: "", bathrooms: "",
  floor: "", building_name: "", space_type: "entire_place", sqft: "",
  headline: "", description: "", monthly_rent: "", security_deposit: "",
  available_from: "", available_until: "", instant_available: false,
  utilities_included: false, amenities: [], nearby_landmarks: [],
  house_rules: "", guest_policy: "", no_smoking: true, pets_allowed: false,
  no_parties: true, quiet_hours: false, custom_rules: "", photoUrls: [],
  is_bbg: false, catalog_unit_id: "",
};

const EXTENDED_AMENITIES = [
  "WiFi", "Laundry", "Parking", "Gym", "Furnished", "Utilities Included",
  "Air Conditioning", "Dishwasher", "Elevator", "Rooftop", "Heating",
  "Washer/Dryer", "Balcony", "Storage",
];

const STEPS = [
  { id: 1, label: "Select User", icon: User },
  { id: 2, label: "Property", icon: Home },
  { id: 3, label: "Photos", icon: ImageIcon },
  { id: 4, label: "Details", icon: BookOpen },
  { id: 5, label: "Pricing", icon: DollarSign },
  { id: 6, label: "Rules", icon: ShieldCheck },
  { id: 7, label: "Review", icon: Eye },
];

const AdminCreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("single");
  const [step, setStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<SelectedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [form, setForm] = useState<ListingForm>(emptyForm);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [newLandmark, setNewLandmark] = useState("");

  // New user creation
  const [createNewUser, setCreateNewUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");

  // CSV / Duplicate state
  const [csvEmail, setCsvEmail] = useState("");
  const [csvUser, setCsvUser] = useState<SelectedUser | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ total: number; success: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dupListingId, setDupListingId] = useState("");
  const [dupUnit, setDupUnit] = useState("");
  const [dupRent, setDupRent] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  const weeklyRent = useMemo(() => {
    const m = parseFloat(form.monthly_rent);
    return m ? Math.round((m * 12) / 52) : null;
  }, [form.monthly_rent]);

  const updateForm = (updates: Partial<ListingForm>) => setForm((p) => ({ ...p, ...updates }));

  // ── User search ──
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
    if (error || data?.error) { toast.error(data?.error || "User not found"); return null; }
    return { id: data.user_id, email: data.email, first_name: data.first_name, last_name: data.last_name };
  };

  // ── Scrape ──
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
      updateForm({
        address: d.address || form.address,
        headline: d.headline || form.headline,
        description: d.description || form.description,
        bedrooms: d.bedrooms != null ? String(d.bedrooms) : form.bedrooms,
        bathrooms: d.bathrooms != null ? String(d.bathrooms) : form.bathrooms,
        sqft: d.sqft != null ? String(d.sqft) : form.sqft,
        monthly_rent: d.monthly_rent != null ? String(d.monthly_rent) : form.monthly_rent,
        photoUrls: d.photos?.length > 0 ? d.photos : form.photoUrls,
        amenities: d.amenities?.length > 0 ? d.amenities : form.amenities,
      });
      toast.success(`Imported ${d.photos?.length || 0} photos and property details`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import property");
    } finally {
      setScraping(false);
    }
  };

  // ── Quick Fill description ──
  const quickFillDescription = () => {
    const parts: string[] = [];
    if (form.bedrooms || form.bathrooms) {
      parts.push(`${form.bedrooms || "?"}BR/${form.bathrooms || "?"}BA ${form.property_type || "apartment"}`);
    }
    if (form.address) parts.push(`located at ${form.address}`);
    if (form.sqft) parts.push(`${form.sqft} sq ft`);
    if (form.amenities.length > 0) parts.push(`Amenities include ${form.amenities.join(", ")}`);
    if (form.utilities_included) parts.push("Utilities included in rent.");
    if (form.available_from) parts.push(`Available from ${form.available_from}`);
    if (form.available_until) parts.push(`through ${form.available_until}`);

    const desc = parts.length > 0
      ? `Beautiful ${parts[0]}${parts[1] ? ` ${parts[1]}` : ""}. ${parts[2] ? `${parts[2]}. ` : ""}${parts[3] ? `${parts[3]}. ` : ""}${parts[4] ? parts[4] + " " : ""}${parts[5] ? `${parts[5]} ${parts[6] || ""}.` : ""} Perfect for students and young professionals looking for a comfortable sublet.`
      : "A great sublet opportunity in a prime location. Perfect for students and young professionals.";

    updateForm({ description: desc });
    toast.success("Description auto-generated!");
  };

  // ── Save ──
  const handleSave = async (status: "draft" | "active") => {
    if (!selectedUser) { toast.error("Please select a user"); return; }
    if (!form.address.trim()) { toast.error("Address is required"); return; }
    if (form.photoUrls.length < 3 && status === "active") { toast.error("At least 3 photos required to publish"); return; }
    setSaving(true);
    try {
      const houseRules = [
        form.no_smoking ? "No smoking" : null,
        form.pets_allowed ? "Pets allowed" : "No pets",
        form.no_parties ? "No parties" : null,
        form.quiet_hours ? "Quiet hours enforced" : null,
        form.custom_rules?.trim() || null,
      ].filter(Boolean).join(". ");

      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: {
          action: "create_listing",
          tenant_id: selectedUser.id,
          listing: {
            address: form.address,
            unit_number: form.unit_number || null,
            property_type: form.property_type || null,
            space_type: form.space_type || null,
            bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
            bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
            sqft: form.sqft ? Number(form.sqft) : null,
            headline: form.headline || null,
            description: form.description || null,
            monthly_rent: form.monthly_rent ? Number(form.monthly_rent) : null,
            security_deposit: form.security_deposit ? Number(form.security_deposit) : null,
            available_from: form.instant_available ? new Date().toISOString().split("T")[0] : form.available_from || null,
            available_until: form.available_until || null,
            amenities: form.amenities,
            house_rules: houseRules,
            guest_policy: form.guest_policy || null,
            photos: form.photoUrls,
            status,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSavedId(data.listing_id);
      toast.success(status === "active" ? "Listing published!" : "Listing saved as draft!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSaving(false);
    }
  };

  // ── Duplicate ──
  const handleDuplicate = async () => {
    if (!dupListingId.trim()) { toast.error("Enter a listing ID"); return; }
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
      toast.success(`Duplicated! New ID: ${data.listing_id}`);
      setDupListingId(""); setDupUnit(""); setDupRent("");
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate");
    } finally {
      setDuplicating(false);
    }
  };

  // ── CSV ──
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV needs header + data rows"); return; }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ""; });
        return row;
      });
      setCsvData(rows);
      toast.success(`Loaded ${rows.length} listings from CSV`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkCreate = async () => {
    if (!csvUser) { toast.error("Look up a user first"); return; }
    if (!csvData.length) { toast.error("No CSV data loaded"); return; }
    setBulkSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-listing", {
        body: { action: "bulk_create", tenant_id: csvUser.id, listings: csvData },
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

  const removePhoto = (i: number) => updateForm({ photoUrls: form.photoUrls.filter((_, idx) => idx !== i) });

  const resetForm = () => {
    setForm(emptyForm); setSelectedUser(null); setUserSearch(""); setUserResults([]);
    setSavedId(null); setScrapeUrl(""); setStep(1); setCreateNewUser(false);
  };

  const addLandmark = () => {
    if (newLandmark.trim()) {
      updateForm({ nearby_landmarks: [...form.nearby_landmarks, newLandmark.trim()] });
      setNewLandmark("");
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin-subin-2026")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create Listing on Behalf of User</h1>
            <p className="text-sm text-muted-foreground">Build a complete listing for any SubIn user in minutes</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Single</TabsTrigger>
            <TabsTrigger value="duplicate" className="flex items-center gap-1.5"><Copy className="h-3.5 w-3.5" /> Duplicate</TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" /> Bulk CSV</TabsTrigger>
          </TabsList>

          {/* ═══════ SINGLE LISTING ═══════ */}
          <TabsContent value="single" className="space-y-6 mt-6">
            {savedId ? (
              <Card className="shadow-card">
                <CardContent className="flex flex-col items-center gap-4 py-12">
                  <CheckCircle2 className="h-12 w-12 text-emerald" />
                  <h2 className="text-lg font-bold text-foreground">Listing Created & Published!</h2>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    The listing has been created under <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>'s account ({selectedUser?.email}). They've been notified and can review/edit it.
                  </p>
                  <a
                    href={`/listings`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    View it live →
                  </a>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetForm}>Create Another</Button>
                    <Button onClick={() => navigate("/admin-subin-2026")}>Back to Dashboard</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Step progress bar */}
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setStep(s.id)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        step === s.id
                          ? "bg-primary text-primary-foreground"
                          : step > s.id
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <s.icon className="h-3.5 w-3.5" />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* ── Step 1: Select User ── */}
                {step === 1 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-primary" />
                        Step 1 — Select or Find the User
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                      ) : createNewUser ? (
                        <div className="space-y-3 rounded-lg border p-4">
                          <p className="text-sm font-medium">Create new user account</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">First Name</Label>
                              <Input value={newUserFirstName} onChange={(e) => setNewUserFirstName(e.target.value)} />
                            </div>
                            <div>
                              <Label className="text-xs">Last Name</Label>
                              <Input value={newUserLastName} onChange={(e) => setNewUserLastName(e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Email</Label>
                            <Input value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="user@email.com" />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCreateNewUser(false)}>Cancel</Button>
                            <Button size="sm" disabled={!newUserEmail.trim()} onClick={async () => {
                              const u = await lookupUser(newUserEmail);
                              if (u) { setSelectedUser(u); setCreateNewUser(false); }
                              else toast.info("User not found — they'll need to sign up first, or look up an existing user.");
                            }}>
                              Find / Create
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Search for user by email or name..."
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
                          <button onClick={() => setCreateNewUser(true)} className="text-xs text-primary hover:underline">
                            + User doesn't exist yet? Create a new account
                          </button>
                        </>
                      )}
                      <div className="flex justify-end">
                        <Button onClick={() => setStep(2)} disabled={!selectedUser}>
                          Next <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 2: Property Details ── */}
                {step === 2 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Home className="h-4 w-4 text-primary" />
                        Step 2 — Property Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm">Is this a Boston Brokerage Group property?</Label>
                        <Switch checked={form.is_bbg} onCheckedChange={(v) => updateForm({ is_bbg: v })} />
                      </div>

                      {form.is_bbg ? (
                        <div className="rounded-lg border p-3 bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-2">Select from BBG catalog (coming soon — enter address manually for now)</p>
                          <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} placeholder="BBG property address..." />
                        </div>
                      ) : (
                        <div>
                          <Label className="text-xs">Address *</Label>
                          <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })} placeholder="123 Main St, Boston, MA" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Unit Number</Label>
                          <Input value={form.unit_number} onChange={(e) => updateForm({ unit_number: e.target.value })} placeholder="Apt 2B" />
                        </div>
                        <div>
                          <Label className="text-xs">Property Type</Label>
                          <Select value={form.property_type} onValueChange={(v) => updateForm({ property_type: v })}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                              {PROPERTY_TYPES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Space Type</Label>
                          <Select value={form.space_type} onValueChange={(v) => updateForm({ space_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entire_place">Entire Apartment</SelectItem>
                              <SelectItem value="private_room">Private Room</SelectItem>
                              <SelectItem value="shared_room">Shared Room</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Floor</Label>
                          <Input type="number" value={form.floor} onChange={(e) => updateForm({ floor: e.target.value })} placeholder="3" />
                        </div>
                        <div>
                          <Label className="text-xs">Bedrooms</Label>
                          <Input type="number" value={form.bedrooms} onChange={(e) => updateForm({ bedrooms: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Bathrooms</Label>
                          <Input type="number" value={form.bathrooms} onChange={(e) => updateForm({ bathrooms: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Sq Ft</Label>
                          <Input type="number" value={form.sqft} onChange={(e) => updateForm({ sqft: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Building Name</Label>
                          <Input value={form.building_name} onChange={(e) => updateForm({ building_name: e.target.value })} placeholder="The Fenway Apartments" />
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <Button onClick={() => setStep(3)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 3: Photos ── */}
                {step === 3 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Step 3 — Import Photos Instantly
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border-2 border-dashed border-primary/30 p-6 text-center space-y-3">
                        <Globe className="h-8 w-8 mx-auto text-primary/50" />
                        <p className="text-sm font-medium">Import photos from Zillow or any property website</p>
                        <p className="text-xs text-muted-foreground">Paste a URL and we'll fetch all available photos</p>
                        <div className="flex gap-2 max-w-lg mx-auto">
                          <Input
                            placeholder="https://www.zillow.com/homedetails/..."
                            value={scrapeUrl}
                            onChange={(e) => setScrapeUrl(e.target.value)}
                          />
                          <Button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()}>
                            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                            <span className="ml-1.5">{scraping ? "Importing..." : "Import"}</span>
                          </Button>
                        </div>
                      </div>

                      <UniversalPhotoUploader
                        photoUrls={form.photoUrls}
                        onPhotoUrlsChange={(urls) => updateForm({ photoUrls: urls })}
                        bucket="listing-photos"
                        storagePath={`admin/${selectedUser?.id || "temp"}`}
                         maxPhotos={15}
                         minPhotos={3}
                        showCoverBadge
                      />

                      <div>
                        <Label className="text-xs mb-1 block">Or add photo URLs manually</Label>
                        <Input
                          placeholder="Paste photo URL and press Enter"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) { updateForm({ photoUrls: [...form.photoUrls, val] }); (e.target as HTMLInputElement).value = ""; }
                            }
                          }}
                        />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <Button onClick={() => setStep(4)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 4: Description & Details ── */}
                {step === 4 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Step 4 — Description & Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs">Property Title</Label>
                        <Input value={form.headline} onChange={(e) => updateForm({ headline: e.target.value })} placeholder="Sunny 2BR in Back Bay — Steps from Northeastern" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Description</Label>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={quickFillDescription}>
                            <Sparkles className="h-3 w-3" /> Quick Fill
                          </Button>
                        </div>
                        <Textarea value={form.description} onChange={(e) => updateForm({ description: e.target.value })} rows={5} placeholder="Describe the property in detail..." />
                      </div>

                      <div>
                        <Label className="text-xs mb-2 block">Amenities</Label>
                        <div className="flex flex-wrap gap-2.5">
                          {EXTENDED_AMENITIES.map((a) => (
                            <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <Checkbox
                                checked={form.amenities.includes(a)}
                                onCheckedChange={(checked) => {
                                  updateForm({
                                    amenities: checked ? [...form.amenities, a] : form.amenities.filter((x) => x !== a),
                                  });
                                }}
                              />
                              {a}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs mb-2 block">Nearby Landmarks</Label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {form.nearby_landmarks.map((l, i) => (
                            <Badge key={i} variant="secondary" className="gap-1">
                              {l}
                              <button onClick={() => updateForm({ nearby_landmarks: form.nearby_landmarks.filter((_, idx) => idx !== i) })}>
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={newLandmark}
                            onChange={(e) => setNewLandmark(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLandmark())}
                            placeholder="e.g. 5 min to Northeastern, Green Line nearby"
                          />
                          <Button variant="outline" size="sm" onClick={addLandmark}>Add</Button>
                        </div>
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <Button onClick={() => setStep(5)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 5: Pricing & Dates ── */}
                {step === 5 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <DollarSign className="h-4 w-4 text-primary" />
                        Step 5 — Pricing & Dates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Monthly Rent ($)</Label>
                          <Input type="number" value={form.monthly_rent} onChange={(e) => updateForm({ monthly_rent: e.target.value })} placeholder="2500" />
                          {weeklyRent && <p className="text-xs text-muted-foreground mt-1">≈ ${weeklyRent}/week</p>}
                        </div>
                        <div>
                          <Label className="text-xs">Security Deposit ($)</Label>
                          <Input type="number" value={form.security_deposit} onChange={(e) => updateForm({ security_deposit: e.target.value })} placeholder="2500" />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Label className="text-sm">Utilities Included</Label>
                        <Switch checked={form.utilities_included} onCheckedChange={(v) => updateForm({ utilities_included: v })} />
                      </div>

                      <div className="flex items-center gap-3">
                        <Label className="text-sm">Available Immediately</Label>
                        <Switch checked={form.instant_available} onCheckedChange={(v) => updateForm({ instant_available: v })} />
                      </div>

                      {!form.instant_available && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Available From</Label>
                            <Input type="date" value={form.available_from} onChange={(e) => updateForm({ available_from: e.target.value })} />
                          </div>
                          <div>
                            <Label className="text-xs">Available Until</Label>
                            <Input type="date" value={form.available_until} onChange={(e) => updateForm({ available_until: e.target.value })} />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <Button onClick={() => setStep(6)}>Next <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 6: House Rules ── */}
                {step === 6 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Step 6 — House Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {([
                          { key: "no_smoking", label: "No Smoking" },
                          { key: "pets_allowed", label: "Pets Allowed" },
                          { key: "no_parties", label: "No Parties" },
                          { key: "quiet_hours", label: "Quiet Hours" },
                        ] as const).map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between">
                            <Label className="text-sm">{label}</Label>
                            <Switch
                              checked={form[key]}
                              onCheckedChange={(v) => updateForm({ [key]: v })}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label className="text-xs">Guest Policy</Label>
                        <Select value={form.guest_policy} onValueChange={(v) => updateForm({ guest_policy: v })}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            {GUEST_POLICIES.map((g) => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Custom Rules</Label>
                        <Textarea value={form.custom_rules} onChange={(e) => updateForm({ custom_rules: e.target.value })} rows={2} placeholder="Any additional rules..." />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setStep(5)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <Button onClick={() => setStep(7)}>Review <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ── Step 7: Review & Publish ── */}
                {step === 7 && (
                  <Card className="shadow-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Eye className="h-4 w-4 text-primary" />
                        Step 7 — Review & Publish
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Summary */}
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Creating for</span>
                          <span className="font-medium">{selectedUser?.first_name} {selectedUser?.last_name} ({selectedUser?.email})</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Address</span>
                          <span className="font-medium">{form.address} {form.unit_number && `#${form.unit_number}`}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Property</span>
                          <span className="font-medium">{form.bedrooms || "?"}BR / {form.bathrooms || "?"}BA · {form.property_type || "—"} · {form.sqft || "—"} sqft</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Rent</span>
                          <span className="font-medium">${form.monthly_rent || "—"}/mo {weeklyRent && `(≈$${weeklyRent}/wk)`}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Deposit</span>
                          <span className="font-medium">${form.security_deposit || "—"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Dates</span>
                          <span className="font-medium">
                            {form.instant_available ? "Available now" : `${form.available_from || "—"} → ${form.available_until || "—"}`}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Photos</span>
                          <span className="font-medium">{form.photoUrls.length} photo(s)</span>
                        </div>
                        {form.amenities.length > 0 && (
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Amenities</span>
                            <span className="font-medium text-right max-w-[60%]">{form.amenities.join(", ")}</span>
                          </div>
                        )}
                        {form.headline && (
                          <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Title</span>
                            <span className="font-medium text-right max-w-[60%]">{form.headline}</span>
                          </div>
                        )}
                      </div>

                      {form.photoUrls.length > 0 && (
                        <div className="grid grid-cols-5 gap-1.5">
                          {form.photoUrls.slice(0, 5).map((url, i) => (
                            <img key={i} src={url} alt="" className="w-full h-16 object-cover rounded-md border" />
                          ))}
                        </div>
                      )}

                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setStep(6)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save as Draft
                          </Button>
                          <Button onClick={() => handleSave("active")} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Publish Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ═══════ DUPLICATE ═══════ */}
          <TabsContent value="duplicate" className="space-y-6 mt-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Copy className="h-4 w-4 text-primary" /> Duplicate Existing Listing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Duplicate a listing and change the unit number and/or rent. Great for multiple units in the same building.
                </p>
                <div>
                  <Label className="text-xs">Listing ID to Duplicate</Label>
                  <Input value={dupListingId} onChange={(e) => setDupListingId(e.target.value)} placeholder="Paste the listing UUID..." />
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

          {/* ═══════ BULK CSV ═══════ */}
          <TabsContent value="bulk" className="space-y-6 mt-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSpreadsheet className="h-4 w-4 text-primary" /> Bulk Upload via CSV
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Upload a CSV with columns: address, unit_number, property_type, bedrooms, bathrooms, sqft, headline, description, monthly_rent, security_deposit, available_from, available_until, amenities, guest_policy, house_rules.
                </p>

                <div className="flex gap-2">
                  <Input placeholder="User email for all listings..." value={csvEmail} onChange={(e) => setCsvEmail(e.target.value)} />
                  <Button size="sm" onClick={async () => { const u = await lookupUser(csvEmail); if (u) setCsvUser(u); }} disabled={!csvEmail.trim()}>
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
                      {bulkSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : <><Plus className="mr-2 h-4 w-4" /> Create {csvData.length} Listings</>}
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
