import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import StarRating from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_role: string;
  created_at: string;
  reviewer_name?: string;
}

interface ReviewSectionProps {
  listingId: string;
  tenantId: string;
}

const ReviewSection = ({ listingId, tenantId }: ReviewSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (user) checkCanReview();
  }, [listingId, user]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, reviewer_role, created_at, reviewer_id")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch reviewer names
      const reviewerIds = [...new Set(data.map((r: any) => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name")
        .in("id", reviewerIds) as { data: { id: string; first_name: string | null; last_name: string | null }[] | null };

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Anonymous"])
      );

      setReviews(
        data.map((r: any) => ({
          ...r,
          reviewer_name: profileMap.get(r.reviewer_id) || "Anonymous",
        }))
      );
    }
    setLoading(false);
  };

  const checkCanReview = async () => {
    if (!user) return;
    // Check if user has a completed booking for this listing and hasn't reviewed yet
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", listingId)
      .eq("subtenant_id", user.id)
      .eq("status", "confirmed");

    if (!bookings || bookings.length === 0) return;

    const bookingIds = bookings.map((b: any) => b.id);
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_id", user.id)
      .eq("listing_id", listingId);

    if (!existingReviews || existingReviews.length === 0) {
      setCanReview(true);
    }
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);

    // Get the booking
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", listingId)
      .eq("subtenant_id", user.id)
      .eq("status", "confirmed")
      .limit(1)
      .single();

    if (!booking) {
      toast.error("No eligible booking found");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      listing_id: listingId,
      booking_id: booking.id,
      reviewer_id: user.id,
      reviewee_id: tenantId,
      rating,
      comment: comment.trim() || null,
      reviewer_role: "subtenant",
    });

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted!");
      setShowForm(false);
      setCanReview(false);
      setRating(0);
      setComment("");
      fetchReviews();
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">Reviews</h3>
          {reviews.length > 0 && (
            <StarRating rating={avgRating} size="sm" showCount count={reviews.length} />
          )}
        </div>
        {canReview && !showForm && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <MessageSquare className="mr-1 h-3.5 w-3.5" /> Write a Review
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Your Rating</p>
              <StarRating rating={rating} size="lg" interactive onChange={setRating} />
            </div>
            <Textarea
              placeholder="Share your experience (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
                {submitting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                Submit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setRating(0); setComment(""); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border bg-card p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{review.reviewer_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <StarRating rating={review.rating} size="sm" />
              {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
