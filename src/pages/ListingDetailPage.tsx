import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, MapPin, Calendar, Bed, Bath, Ruler, Home, Heart, MessageSquare, Loader2, ChevronLeft, ChevronRight, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";

import SecureThisPlace from "@/components/listing/SecureThisPlace";
import KnockButton from "@/components/KnockButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoPlayer from "@/components/video/VideoPlayer";
import MakeOfferModal from "@/components/urgent/MakeOfferModal";

interface ListingDetail {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  available_from: string | null;
  available_until: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  description: string | null;
  source: string;
  tenant_id: string;
  manager_id: string | null;
  management_group_id: string | null;
  property_type?: string | null;
  intro_video_url?: string | null;
  is_urgent?: boolean;
  asking_price?: number | null;
  urgency_deadline?: string | null;
  house_rules?: string | null;
  amenities?: string[] | null;
  space_type?: string | null;
  knock_count?: number;
}

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantVerified, setTenantVerified] = useState(false);
  const [tenantName, setTenantName] = useState("Host");
  const [saved, setSaved] = useState(false);
  const [contactingId, setContactingId] = useState<string | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  // Photo gallery state
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, available_from, available_until, bedrooms, bathrooms, sqft, description, source, tenant_id, manager_id, management_group_id, property_type, intro_video_url, is_urgent, asking_price, urgency_deadline, house_rules, amenities, space_type, knock_count")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();

      if (!data) { setLoading(false); return; }
      setListing(data as ListingDetail);

      // Fetch tenant info
      const { data: profile } = await supabase.from("profiles").select("id_verified, first_name, last_name").eq("id", data.tenant_id).maybeSingle() as any;
      if (profile) {
        setTenantVerified(profile.id_verified);
        setTenantName([profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Host");
      }

      // Track view
      if (user) {
        supabase.from("listing_views").insert({ listing_id: data.id, viewer_id: user.id }).then();
      }

      // Check saved
      if (user) {
        const { data: s } = await supabase.from("saved_listings").select("id").eq("user_id", user.id).eq("listing_id", data.id).maybeSingle();
        setSaved(!!s);
      }

      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const toggleSave = async () => {
    if (!user || !listing) { requireAuth(() => toggleSave()); return; }
    setSaved(!saved);
    if (saved) await supabase.from("saved_listings").delete().eq("user_id", user.id).eq("listing_id", listing.id);
    else await supabase.from("saved_listings").insert({ user_id: user.id, listing_id: listing.id });
  };

  const handleContact = async () => {
    if (!user || !listing) { requireAuth(() => handleContact()); return; }
    setContactingId(listing.id);
    const { data: existing } = await supabase.from("conversations").select("id").eq("listing_id", listing.id).or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).maybeSingle();
    if (existing) { setContactingId(null); navigate(`/messages?conversation=${existing.id}`); return; }
    const { data: convo, error } = await supabase.from("conversations").insert({ participant_1: user.id, participant_2: listing.tenant_id, listing_id: listing.id }).select("id").single();
    setContactingId(null);
    if (error || !convo) { toast.error("Failed to start conversation."); return; }
    await supabase.from("messages").insert({ conversation_id: convo.id, sender_id: user.id, content: `Hi! I'm interested in your listing "${listing.headline || "your apartment"}". Is it still available?` });
    toast.success("Message sent!");
    navigate(`/messages?conversation=${convo.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      navigator.share({ title: listing?.headline || "Check out this listing", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const formatDates = (from: string | null, until: string | null) => {
    if (!from) return "Dates not specified";
    const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!until) return `From ${f}`;
    const u = new Date(until).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${f} - ${u}`;
  };

  const isOwnListing = user && listing && listing.tenant_id === user.id;
  const photos = listing?.photos || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-[18px] font-semibold text-foreground">Listing not found</p>
        <Button variant="outline" className="rounded-full" onClick={() => navigate("/listings")}>Back to listings</Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        {/* PHOTO GALLERY */}
        <div className="relative">
          {/* Mobile: swipeable single photo */}
          <div className="md:hidden">
            {photos.length > 0 ? (
              <div className="relative h-[320px]">
                <img
                  src={photos[currentPhoto]}
                  alt={listing.headline || ""}
                  className="h-full w-full object-cover object-center"
                />
                {/* Back arrow */}
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white z-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {/* Actions */}
                <div className="absolute right-4 top-4 flex items-center gap-2 z-10">
                  <button onClick={handleShare} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={toggleSave} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm text-white">
                    <Heart className={cn("h-4 w-4", saved && "fill-red-500 text-red-500")} />
                  </button>
                </div>
                {/* Nav arrows */}
                {photos.length > 1 && (
                  <>
                    {currentPhoto > 0 && (
                      <button onClick={() => setCurrentPhoto(currentPhoto - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                    )}
                    {currentPhoto < photos.length - 1 && (
                      <button onClick={() => setCurrentPhoto(currentPhoto + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    )}
                  </>
                )}
                {/* Counter pill */}
                {photos.length > 1 && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white font-medium">
                    {currentPhoto + 1} / {photos.length}
                  </span>
                )}
              </div>
            ) : (
              <div className="h-[320px] bg-muted flex items-center justify-center">
                <Home className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* Desktop: grid layout */}
          <div className="hidden md:block max-w-[900px] mx-auto px-6 pt-6">
            {/* Back + actions row */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[15px] text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to listings
              </button>
              <div className="flex items-center gap-2">
                <button onClick={handleShare} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button onClick={toggleSave} className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  <Heart className={cn("h-4 w-4", saved && "fill-red-500 text-red-500")} /> Save
                </button>
              </div>
            </div>

            {photos.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 480 }}>
                {photos.length === 1 ? (
                  /* Single photo: full width */
                  <div className="h-full w-full cursor-pointer" onClick={() => { setCurrentPhoto(0); setLightboxOpen(true); }}>
                    <img src={photos[0]} alt="" className="h-full w-full object-cover object-center" />
                  </div>
                ) : photos.length === 2 ? (
                  /* Two photos: equal columns */
                  <div className="grid grid-cols-2 gap-1 h-full">
                    {photos.map((p, i) => (
                      <div key={i} className="cursor-pointer overflow-hidden" onClick={() => { setCurrentPhoto(i); setLightboxOpen(true); }}>
                        <img src={p} alt="" className="h-full w-full object-cover object-center" />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* 3+ photos: 60/40 split */
                  <div className="grid h-full gap-1" style={{ gridTemplateColumns: "3fr 2fr" }}>
                    <div className="cursor-pointer overflow-hidden" onClick={() => { setCurrentPhoto(0); setLightboxOpen(true); }}>
                      <img src={photos[0]} alt="" className="h-full w-full object-cover object-center" />
                    </div>
                    <div className="grid grid-rows-2 gap-1 h-full">
                      {photos.slice(1, 3).map((p, i) => (
                        <div key={i} className="cursor-pointer overflow-hidden" onClick={() => { setCurrentPhoto(i + 1); setLightboxOpen(true); }}>
                          <img src={p} alt="" className="h-full w-full object-cover object-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show all photos button */}
                {photos.length > 3 && (
                  <button
                    onClick={() => { setCurrentPhoto(0); setLightboxOpen(true); }}
                    className="absolute bottom-4 right-4 rounded-lg bg-white border border-border px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm hover:bg-white/90 transition-colors"
                  >
                    Show all {photos.length} photos
                  </button>
                )}
              </div>
            ) : (
              <div className="h-[300px] bg-muted rounded-2xl flex items-center justify-center">
                <Home className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-[900px] mx-auto px-4 md:px-6 pt-6">
          <div className="md:grid md:grid-cols-[1fr_320px] md:gap-10">
            {/* Left column: details */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[28px] font-bold text-foreground leading-tight">{listing.headline || "Untitled listing"}</h1>
                  {listing.is_urgent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[13px] font-semibold text-amber-700">
                      <Zap className="h-3 w-3" /> Urgent
                    </span>
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-[15px] text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4 shrink-0" />{listing.address || "Address not specified"}
                </p>
                {tenantVerified && (
                  <div className="mt-2">
                    <VerifiedBadge verified />
                  </div>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center divide-x divide-border">
                {[
                  { label: "Rent", value: listing.monthly_rent ? `$${listing.monthly_rent.toLocaleString()}/mo` : "TBD" },
                  { label: "Beds", value: listing.bedrooms != null ? String(listing.bedrooms) : "-" },
                  { label: "Baths", value: listing.bathrooms != null ? String(listing.bathrooms) : "-" },
                  ...(listing.sqft ? [{ label: "Sq ft", value: listing.sqft.toLocaleString() }] : []),
                ].map((s, i) => (
                  <div key={s.label} className={cn("text-center flex-1", i > 0 && "pl-4")}>
                    <p className="text-[18px] font-bold text-foreground">{s.value}</p>
                    <p className="text-[13px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-[15px] text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                {formatDates(listing.available_from, listing.available_until)}
              </div>

              {/* Video */}
              {listing.intro_video_url && (
                <VideoPlayer videoUrl={listing.intro_video_url} tenantName={tenantName} verified={tenantVerified} />
              )}

              {/* Description */}
              {listing.description && (
                <div>
                  <h2 className="text-[18px] font-semibold text-foreground mb-2">About this place</h2>
                  <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">{listing.description}</p>
                </div>
              )}

              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div>
                  <h2 className="text-[18px] font-semibold text-foreground mb-2">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((a) => (
                      <span key={a} className="rounded-full border px-3 py-1.5 text-[13px] text-muted-foreground">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* House rules */}
              {listing.house_rules && (
                <div>
                  <h2 className="text-[18px] font-semibold text-foreground mb-2">House rules</h2>
                  <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line">{listing.house_rules}</p>
                </div>
              )}

              {/* Hosted by */}
              <div className="border-t pt-6">
                <h2 className="text-[18px] font-semibold text-foreground mb-1">Hosted by {tenantName}</h2>
                {tenantVerified && <p className="text-[13px] text-muted-foreground">Identity verified</p>}
              </div>

              {/* Mobile actions (hidden on desktop where sticky card is used) */}
              <div className="md:hidden space-y-3 pb-4">
                {!isOwnListing && (
                  <>
                    <KnockButton listingId={listing.id} tenantId={listing.tenant_id} listingHeadline={listing.headline} listingAddress={listing.address} knockCount={listing.knock_count || 0} />
                    <Button variant="outline" className="w-full rounded-full h-12 text-[15px]" onClick={handleContact} disabled={contactingId === listing.id}>
                      {contactingId === listing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Opening chat...</> : <><MessageSquare className="mr-1 h-4 w-4" />Send a message</>}
                    </Button>
                  </>
                )}
                {isOwnListing && (
                  <Button className="w-full rounded-full h-12 text-[15px]" onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                    Edit listing
                  </Button>
                )}
              </div>
            </div>

            {/* Right column: sticky action card (desktop only) */}
            <div className="hidden md:block">
              <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-card space-y-4">
                <div className="text-center">
                  <p className="text-[28px] font-bold text-primary">
                    {listing.monthly_rent ? `$${listing.monthly_rent.toLocaleString()}` : "TBD"}
                    <span className="text-[15px] font-normal text-muted-foreground">/mo</span>
                  </p>
                  {listing.is_urgent && listing.asking_price && listing.asking_price < (listing.monthly_rent || 0) && (
                    <p className="text-[13px] text-emerald-600 font-medium mt-1">
                      Asking ${listing.asking_price.toLocaleString()}/mo
                    </p>
                  )}
                </div>
                <p className="text-[13px] text-muted-foreground text-center">
                  {formatDates(listing.available_from, listing.available_until)}
                </p>

                {!isOwnListing && (
                  <>
                    {listing.is_urgent ? (
                      <Button className="w-full rounded-full h-12 text-[15px]" onClick={() => setOfferOpen(true)}>
                        Make an offer
                      </Button>
                    ) : (
                      <SecureThisPlace listing={listing} />
                    )}
                    <KnockButton listingId={listing.id} tenantId={listing.tenant_id} listingHeadline={listing.headline} listingAddress={listing.address} knockCount={listing.knock_count || 0} />
                    <Button variant="outline" className="w-full rounded-full h-12 text-[15px]" onClick={handleContact} disabled={contactingId === listing.id}>
                      {contactingId === listing.id ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Opening chat...</> : <><MessageSquare className="mr-1 h-4 w-4" />Send a message</>}
                    </Button>
                  </>
                )}
                {isOwnListing && (
                  <Button className="w-full rounded-full h-12 text-[15px]" onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                    Edit listing
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE STICKY BOTTOM BAR */}
        {!isOwnListing && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-elevated z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-[18px] font-bold text-primary">
                  {listing.monthly_rent ? `$${listing.monthly_rent.toLocaleString()}` : "TBD"}
                  <span className="text-[13px] font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              {listing.is_urgent ? (
                <Button className="rounded-full h-12 px-8 text-[15px]" onClick={() => setOfferOpen(true)}>
                  Make an offer
                </Button>
              ) : (
                <SecureThisPlace listing={listing} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {lightboxOpen && photos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
            <X className="h-6 w-6" />
          </button>
          <span className="absolute top-4 left-4 text-white/80 text-[15px]">{currentPhoto + 1} / {photos.length}</span>
          <img src={photos[currentPhoto]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
          {currentPhoto > 0 && (
            <button onClick={() => setCurrentPhoto(currentPhoto - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {currentPhoto < photos.length - 1 && (
            <button onClick={() => setCurrentPhoto(currentPhoto + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}

      {/* Offer modal */}
      {offerOpen && listing && (
        <MakeOfferModal open={offerOpen} onClose={() => setOfferOpen(false)} listing={listing} />
      )}
    </>
  );
};

export default ListingDetailPage;
