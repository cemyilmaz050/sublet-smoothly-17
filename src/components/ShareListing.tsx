import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Share2, Link2, MessageCircle, Mail, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareListingProps {
  listingId: string;
  headline: string | null;
  address: string | null;
}

const ShareListing = ({ listingId, headline, address }: ShareListingProps) => {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const listingUrl = `${window.location.origin}/listings?id=${listingId}`;
  const shareText = `Check out this sublet: ${headline || "Apartment"} at ${address || "a great location"}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(listingUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${listingUrl}`)}`,
      "_blank"
    );
    setOpen(false);
  };

  const handleText = () => {
    window.open(
      `sms:?body=${encodeURIComponent(`${shareText} ${listingUrl}`)}`,
      "_blank"
    );
    setOpen(false);
  };

  const handleEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent(`SubIn: ${headline || "Check out this sublet"}`)}&body=${encodeURIComponent(`${shareText}\n\n${listingUrl}`)}`,
      "_blank"
    );
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="end">
        <div className="space-y-1">
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </button>
          <button
            onClick={handleText}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Text Message
          </button>
          <button
            onClick={handleEmail}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareListing;
