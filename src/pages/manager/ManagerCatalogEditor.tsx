import { useState, useEffect, useCallback } from "react";
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
  ArrowLeft, Save, Loader2, X, Plus, Upload, MapPin, Home, Image as ImageIcon, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const BUILDING_AMENITIES = [
  "Elevator", "Laundry", "Gym", "Parking", "Rooftop", "Storage",
  "Doorman", "Pool", "Bike Room", "Package Room",
];

const SPACE_TYPES = [
  { value: "entire_place", label: "Entire Apartment" },
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
];

const UTILITIES = ["Gas", "Electric", "Water", "Internet", "Heat", "Trash"];

const ManagerCatalogEditor = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Form state
  const [form, setForm] = useState({
    // Property details
    space_type: "entire_place",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    floor: "",
    building_amenities: [] as string[],
    // Photos
    photos: [] as string[],
    // Description
    description: "",
    // Pricing
    base_rent: "",
    security_deposit: "",
    utilities_included: false,
    included_utilities: [] as string[],
    // Availability
    available_from: "",
    available_until: "",
    // House rules
    no_smoking: true,
    pets_allowed: false,
    no_parties: true,
    quiet_hours: false,
    custom_rules: "",
    // Nearby
    nearby_landmarks: [] as string[],
  });

  const [newLandmark, setNewLandmark] = useState("");

  // Load property + unit data
  useEffect(() => {
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
        navigate("/manager/catalog");
        return;
      }

      // Check for existing unit record
      const { data: units } = await supabase
        .from("catalog_units")
        .select("*")
        .eq("property_id", propertyId)
        .limit(1);

      const unit = units?.[0];

      setProperty(prop);
      setForm({
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
  }, [propertyId, navigate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !propertyId) return;
    setUploadingPhotos(true);
    const newUrls = [...form.photos];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `catalog/${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("listing-photos").upload(path, file);
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      const { data: urlData } = supabase.storage.from("listing-photos").getPublicUrl(path);
      newUrls.push(urlData.publicUrl);
    }

    setForm((prev) => ({ ...prev, photos: newUrls }));
    setUploadingPhotos(false);
    toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
  };

  const removePhoto = (idx: number) => {
    setForm((prev) => ({ ...prev, photos: prev.photos.filter((_, i) => i !== idx) }));
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

  const handleSave = async () => {
    if (!propertyId || !user) return;
    setSaving(true);

    try {
      // Update catalog_properties with building amenities
      await supabase
        .from("catalog_properties")
        .update({
          building_amenities: form.building_amenities,
          photo_url: form.photos[0] || null,
        } as any)
        .eq("id", propertyId);

      // Upsert catalog_unit
      const { data: existingUnits } = await supabase
        .from("catalog_units")
        .select("id")
        .eq("property_id", propertyId)
        .limit(1);

      const unitPayload = {
        property_id: propertyId,
        unit_number: property?.address || "main",
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

      if (existingUnits?.length) {
        await supabase
          .from("catalog_units")
          .update(unitPayload)
          .eq("id", existingUnits[0].id);
      } else {
        await supabase
          .from("catalog_units")
          .insert(unitPayload);
      }

      queryClient.invalidateQueries({ queryKey: ["manager-catalog"] });
      toast.success("Property updated — all listings for this property have been refreshed");
    } catch (err: any) {
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/manager/catalog")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{property?.address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Property Catalog Editor
          </p>
        </div>
      </div>

      {/* Property Details */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Property Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Property Address</Label>
            <Input value={property?.address || ""} disabled className="mt-1.5 bg-muted" />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Label>Floor Number</Label>
              <Input type="number" min={0} placeholder="e.g. 3" className="mt-1.5"
                value={form.floor} onChange={(e) => setForm((p) => ({ ...p, floor: e.target.value }))} />
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
            <Label className="text-sm font-medium">Building Amenities</Label>
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
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.photos.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-accent">
                <img src={url} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <Badge className="absolute left-1.5 top-1.5 text-[10px]">Cover</Badge>
                )}
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {form.photos.length < 20 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                {uploadingPhotos ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span className="text-[10px]">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload up to 20 photos. The first photo becomes the cover image.
          </p>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Write a detailed description of the property. Include: Overview, What's included, Neighborhood highlights, Nearby transport..."
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
              <Label>Base Monthly Rent ($)</Label>
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
        <CardHeader><CardTitle className="text-lg">Default Availability</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-3">
            These dates can be overridden by individual sublessors when they create a listing.
          </p>
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
        <CardHeader><CardTitle className="text-lg">Nearby Landmarks</CardTitle></CardHeader>
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

      {/* Save */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm py-4 border-t -mx-6 px-6 lg:-mx-8 lg:px-8">
        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save Changes</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ManagerCatalogEditor;
