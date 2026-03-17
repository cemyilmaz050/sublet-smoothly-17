import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, Save, Loader2, X, Plus, MapPin, Link as LinkIcon,
} from "lucide-react";
import UniversalPhotoUploader from "@/components/UniversalPhotoUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const BBG_PM_ID = "d39b883c-0941-4620-96d6-ea588231b58e";


const BUILDING_AMENITIES = [
  "Elevator", "Laundry", "Gym", "Parking", "Rooftop", "Storage",
  "Doorman", "Pool", "Bike Room", "Package Room", "WiFi", "Furnished",
  "Air Conditioning", "Heating", "Washer/Dryer", "Dishwasher",
];

const SPACE_TYPES = [
  { value: "entire_place", label: "Entire Apartment" },
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "studio", label: "Studio" },
  { value: "house", label: "House" },
];

const UTILITIES = ["Gas", "Electric", "Water", "Internet", "Heat", "Trash"];

const ManagerCatalogEditor = () => {
  const { propertyId } = useParams();
  const isNew = propertyId === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [property, setProperty] = useState<any>(null);
  
  const [existingUnitId, setExistingUnitId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");

  const [form, setForm] = useState({
    // Property-level
    address: "",
    name: "",
    property_type: "apartment",
    // Unit-level
    headline: "",
    space_type: "entire_place",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    floor: "",
    building_amenities: [] as string[],
    photos: [] as string[],
    description: "",
    base_rent: "",
    security_deposit: "",
    utilities_included: false,
    included_utilities: [] as string[],
    available_from: "",
    available_until: "",
    no_smoking: true,
    pets_allowed: false,
    no_parties: true,
    quiet_hours: false,
    custom_rules: "",
    nearby_landmarks: [] as string[],
  });

  const [newLandmark, setNewLandmark] = useState("");

  // Load property + unit + listing data
  useEffect(() => {
    if (isNew) return;
    if (!propertyId) return;
    const load = async () => {
      setLoading(true);
      const { data: prop } = await supabase
        .from("catalog_properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (!prop) {
        toast.error("Property not found");
        navigate("/portal-mgmt-bbg/catalog");
        return;
      }

      const { data: units } = await supabase
        .from("catalog_units")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1);

      const unit = units?.[0];
      if (unit) setExistingUnitId(unit.id);


      setProperty(prop);
      setForm({
        address: prop.address || "",
        name: prop.name || "",
        property_type: prop.property_type || "apartment",
        headline: unit?.description?.substring(0, 80) || "",
        space_type: (unit as any)?.space_type || "entire_place",
        bedrooms: unit?.bedrooms?.toString() || "",
        bathrooms: unit?.bathrooms?.toString() || "",
        sqft: unit?.sqft?.toString() || "",
        floor: unit?.floor?.toString() || "",
        building_amenities: (prop as any)?.building_amenities || [],
        photos: (unit?.photos as string[]) || [],
        description: unit?.description || "",
        base_rent: (unit as any)?.base_rent?.toString() || "",
        security_deposit: (unit as any)?.security_deposit?.toString() || "",
        utilities_included: (unit as any)?.utilities_included || false,
        included_utilities: (unit as any)?.included_utilities || [],
        available_from: (unit as any)?.available_from || "",
        available_until: (unit as any)?.available_until || "",
        no_smoking: (unit as any)?.no_smoking ?? true,
        pets_allowed: (unit as any)?.pets_allowed ?? false,
        no_parties: (unit as any)?.no_parties ?? true,
        quiet_hours: (unit as any)?.quiet_hours ?? false,
        custom_rules: (unit as any)?.custom_rules || "",
        nearby_landmarks: (unit as any)?.nearby_landmarks || [],
      });
      setLoading(false);
    };
    load();
  }, [propertyId, isNew, navigate]);

  const handleImportUrl = () => {
    if (!importUrl.trim()) return;
    const url = importUrl.trim();
    if (!url.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http");
      return;
    }
    setForm((prev) => ({ ...prev, photos: [...prev.photos, url] }));
    setImportUrl("");
    toast.success("Photo URL added");
  };

  const toggleAmenity = (amenity: string) => {
    setForm((prev) => ({
      ...prev,
      building_amenities: prev.building_amenities.includes(amenity)
        ? prev.building_amenities.filter((a) => a !== amenity)
        : [...prev.building_amenities, amenity],
    }));
  };

  const toggleUtility = (util: string) => {
    setForm((prev) => ({
      ...prev,
      included_utilities: prev.included_utilities.includes(util)
        ? prev.included_utilities.filter((u) => u !== util)
        : [...prev.included_utilities, util],
    }));
  };

  const addLandmark = () => {
    if (!newLandmark.trim()) return;
    setForm((prev) => ({ ...prev, nearby_landmarks: [...prev.nearby_landmarks, newLandmark.trim()] }));
    setNewLandmark("");
  };

  const removeLandmark = (idx: number) => {
    setForm((prev) => ({ ...prev, nearby_landmarks: prev.nearby_landmarks.filter((_, i) => i !== idx) }));
  };

  const buildHouseRules = () => {
    const rules: string[] = [];
    if (form.no_smoking) rules.push("No smoking");
    if (form.no_parties) rules.push("No parties");
    if (form.quiet_hours) rules.push("Quiet hours enforced");
    if (!form.pets_allowed) rules.push("No pets");
    else rules.push("Pets allowed");
    if (form.custom_rules) rules.push(form.custom_rules);
    return rules.join(". ");
  };

  const savePropertyAndUnit = async () => {
    let propId = propertyId;

    if (isNew) {
      if (!form.address.trim()) {
        toast.error("Address is required");
        return null;
      }
      // Create new catalog property
      const { data: newProp, error: propErr } = await supabase
        .from("catalog_properties")
        .insert({
          address: form.address.trim(),
          name: form.name.trim() || null,
          property_type: form.property_type,
          manager_id: BBG_PM_ID,
          photo_url: form.photos[0] || null,
          building_amenities: form.building_amenities,
        } as any)
        .select()
        .single();
      if (propErr) throw propErr;
      propId = newProp.id;
      setProperty(newProp);
    } else {
      // Update catalog property
      const { error } = await supabase
        .from("catalog_properties")
        .update({
          address: form.address.trim(),
          name: form.name.trim() || null,
          property_type: form.property_type,
          building_amenities: form.building_amenities,
          photo_url: form.photos[0] || null,
        } as any)
        .eq("id", propId!);
      if (error) throw error;
    }

    // Upsert catalog unit
    const unitPayload = {
      property_id: propId,
      unit_number: form.address.trim() || "main",
      space_type: form.space_type,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      sqft: form.sqft ? Number(form.sqft) : null,
      floor: form.floor ? Number(form.floor) : null,
      photos: form.photos,
      description: form.description || null,
      amenities: form.building_amenities,
      base_rent: form.base_rent ? Number(form.base_rent) : null,
      security_deposit: form.security_deposit ? Number(form.security_deposit) : null,
      utilities_included: form.utilities_included,
      included_utilities: form.included_utilities,
      available_from: form.available_from || null,
      available_until: form.available_until || null,
      no_smoking: form.no_smoking,
      pets_allowed: form.pets_allowed,
      no_parties: form.no_parties,
      quiet_hours: form.quiet_hours,
      custom_rules: form.custom_rules || null,
      nearby_landmarks: form.nearby_landmarks,
    } as any;

    if (existingUnitId) {
      const { error } = await supabase.from("catalog_units").update(unitPayload).eq("id", existingUnitId);
      if (error) throw error;
    } else {
      const { data: newUnit, error } = await supabase.from("catalog_units").insert(unitPayload).select().single();
      if (error) throw error;
      if (newUnit) setExistingUnitId(newUnit.id);
    }

    return propId;
  };


  const handleSaveToCatalog = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const propId = await savePropertyAndUnit();
      if (!propId) { setSaving(false); return; }
      queryClient.invalidateQueries({ queryKey: ["manager-catalog"] });
      toast.success("Saved to catalog");
      if (isNew) navigate(`/portal-mgmt-bbg/catalog/${propId}`, { replace: true });
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/portal-mgmt-bbg/catalog")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isNew ? "Add New Property" : (property?.name || property?.address || "Edit Property")}
          </h1>
           <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {isNew ? "Add to catalog — subletters will choose from this" : "Property Catalog Editor"}
          </p>
        </div>
      </div>

      {/* Title & Address */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Listing Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Property Title / Headline</Label>
            <Input
              placeholder="e.g. Sunny 2BR near Northeastern"
              className="mt-1.5"
              value={form.headline}
              onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
            />
          </div>
          <div>
            <Label>Property Name (optional)</Label>
            <Input
              placeholder="e.g. The Fenway Apartments"
              className="mt-1.5"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Full Address *</Label>
            <Input
              placeholder="123 Main St, Boston, MA 02115"
              className="mt-1.5"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              disabled={!isNew && !!property}
            />
            {!isNew && <p className="text-xs text-muted-foreground mt-1">Address cannot be changed after creation.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Property Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property Type</Label>
              <Select value={form.property_type} onValueChange={(v) => setForm((p) => ({ ...p, property_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit Type</Label>
              <Select value={form.space_type} onValueChange={(v) => setForm((p) => ({ ...p, space_type: v }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPACE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Bedrooms</Label>
              <Input type="number" min={0} placeholder="2" className="mt-1.5"
                value={form.bedrooms} onChange={(e) => setForm((p) => ({ ...p, bedrooms: e.target.value }))} />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input type="number" min={0} placeholder="1" className="mt-1.5"
                value={form.bathrooms} onChange={(e) => setForm((p) => ({ ...p, bathrooms: e.target.value }))} />
            </div>
            <div>
              <Label>Sq Ft</Label>
              <Input type="number" min={0} placeholder="750" className="mt-1.5"
                value={form.sqft} onChange={(e) => setForm((p) => ({ ...p, sqft: e.target.value }))} />
            </div>
          </div>

          <div>
            <Label>Floor Number</Label>
            <Input type="number" min={0} placeholder="e.g. 3" className="mt-1.5 max-w-32"
              value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} />
          </div>

          <div>
            <Label className="text-sm font-medium">Amenities</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUILDING_AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    form.building_amenities.includes(a)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Photos</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <UniversalPhotoUploader
            photoUrls={form.photos}
            onPhotoUrlsChange={(urls) => setForm((prev) => ({ ...prev, photos: urls }))}
            bucket="listing-photos"
            storagePath={`catalog/${propertyId === "new" ? "new" : propertyId}`}
            maxPhotos={20}
            minPhotos={0}
            showCoverBadge
          />

          {/* Import from URL */}
          <div className="flex gap-2">
            <Input
              placeholder="Import photo from URL (e.g. Zillow image link)"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleImportUrl())}
            />
            <Button variant="outline" size="sm" onClick={handleImportUrl} disabled={!importUrl.trim()}>
              <LinkIcon className="mr-1 h-3.5 w-3.5" />
              Import
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Upload up to 20 photos. The first photo becomes the cover image shown on listing cards.
          </p>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Description & Overview</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write a detailed description. Include: Overview, What's included, Neighborhood highlights, Nearby transport..."
            rows={6}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monthly Rent ($) *</Label>
              <Input type="number" min={0} placeholder="2400" className="mt-1.5"
                value={form.base_rent} onChange={(e) => setForm((p) => ({ ...p, base_rent: e.target.value }))} />
            </div>
            <div>
              <Label>Security Deposit ($)</Label>
              <Input type="number" min={0} placeholder="2400" className="mt-1.5"
                value={form.security_deposit} onChange={(e) => setForm((p) => ({ ...p, security_deposit: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.utilities_included}
              onCheckedChange={(v) => setForm((p) => ({ ...p, utilities_included: v }))}
            />
            <Label>Utilities included in rent</Label>
          </div>
          {form.utilities_included && (
            <div className="flex flex-wrap gap-2">
              {UTILITIES.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => toggleUtility(u)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    form.included_utilities.includes(u)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {u}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Availability</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Available From</Label>
              <Input type="date" className="mt-1.5"
                value={form.available_from} onChange={(e) => setForm((p) => ({ ...p, available_from: e.target.value }))} />
            </div>
            <div>
              <Label>Available Until</Label>
              <Input type="date" className="mt-1.5"
                value={form.available_until} onChange={(e) => setForm((p) => ({ ...p, available_until: e.target.value }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* House Rules */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">House Rules</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "no_smoking", label: "No Smoking" },
              { key: "pets_allowed", label: "Pets Allowed" },
              { key: "no_parties", label: "No Parties" },
              { key: "quiet_hours", label: "Quiet Hours" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch
                  checked={(form as any)[key]}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, [key]: v }))}
                />
                <Label>{label}</Label>
              </div>
            ))}
          </div>
          <div>
            <Label>Additional Rules</Label>
            <Textarea
              placeholder="Any additional rules or guidelines..."
              rows={3}
              className="mt-1.5"
              value={form.custom_rules}
              onChange={(e) => setForm((p) => ({ ...p, custom_rules: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Nearby Landmarks */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Nearby Landmarks & Universities</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {form.nearby_landmarks.map((lm, i) => (
              <Badge key={i} variant="secondary" className="flex items-center gap-1 px-3 py-1.5">
                {lm}
                <button onClick={() => removeLandmark(i)}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 5 min walk to Northeastern"
              value={newLandmark}
              onChange={(e) => setNewLandmark(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLandmark())}
            />
            <Button variant="outline" size="sm" onClick={addLandmark} disabled={!newLandmark.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t -mx-6 px-6 lg:-mx-8 lg:px-8">
        <Button
          onClick={handleSaveToCatalog}
          disabled={saving}
          size="lg"
          className="w-full"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save to Catalog</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          This saves to your internal catalog only. Listings go public when a subletter creates one and you approve it.
        </p>
      </div>
    </div>
  );
};

export default ManagerCatalogEditor;
