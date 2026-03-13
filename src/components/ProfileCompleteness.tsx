import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera, Phone, FileText, CheckCircle2, AlertCircle, Loader2, X,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const ProfileCompleteness = () => {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone, avatar_url, bio")
      .eq("id", user!.id)
      .single();
    if (data) {
      setProfile(data as ProfileData);
      setPhone(data.phone || "");
      setBio((data as any).bio || "");
    }
    setLoading(false);
  };

  if (loading || !profile) return null;

  const checks = [
    { label: "Name", done: !!(profile.first_name && profile.last_name) },
    { label: "Profile photo", done: !!profile.avatar_url, icon: Camera },
    { label: "Phone number", done: !!profile.phone, icon: Phone },
    { label: "Short bio", done: !!profile.bio, icon: FileText },
  ];
  const completed = checks.filter((c) => c.done).length;
  const percentage = Math.round((completed / checks.length) * 100);

  if (percentage === 100) return null;

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: urlData.publicUrl } : p);
    toast.success("Photo uploaded!");
    setUploading(false);
  };

  const handleSaveDetails = async () => {
    if (!user) return;
    setSaving(true);
    const updates: Record<string, string> = {};
    if (phone && !profile.phone) updates.phone = phone;
    if (bio && !profile.bio) updates.bio = bio;
    if (Object.keys(updates).length === 0) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      setProfile((p) => p ? { ...p, ...updates } : p);
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Profile {percentage}% complete
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <X className="h-4 w-4" /> : "Complete"}
          </Button>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex flex-wrap gap-2">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${
                c.done
                  ? "bg-emerald/10 text-emerald"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {c.done ? <CheckCircle2 className="h-3 w-3" /> : null}
              {c.label}
            </span>
          ))}
        </div>

        {expanded && (
          <div className="space-y-3 pt-2 border-t">
            {!profile.avatar_url && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Profile Photo</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
                  Upload Photo
                </Button>
              </div>
            )}
            {!profile.phone && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Phone Number</p>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}
            {!profile.bio && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Short Bio</p>
                <Textarea
                  placeholder="Tell others a bit about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
            )}
            {(!profile.phone || !profile.bio) && (
              <Button size="sm" onClick={handleSaveDetails} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompleteness;
