import { Link } from "react-router-dom";
import { Globe, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background w-full">
      <div className="flex h-12 items-center justify-between px-6 w-full">
        {/* Left side */}
        <div className="flex items-center gap-0 text-[13px] text-muted-foreground">
          <span>© 2026 SubIn</span>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="rounded px-1.5 py-0.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="rounded px-1.5 py-0.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
            Terms
          </Link>
          <span className="mx-2">·</span>
          <button className="rounded px-1.5 py-0.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
            Your Privacy Choices
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
          <button className="hidden items-center gap-1.5 rounded px-2 py-1 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground sm:flex">
            <Globe className="h-4 w-4" />
            <span>English (US)</span>
          </button>
          <button className="hidden items-center gap-1 rounded px-2 py-1 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground sm:flex">
            <span>$</span>
            <span>USD</span>
          </button>
          <div className="flex items-center gap-1">
            <a href="https://facebook.com/subin" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-full p-1.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://x.com/subin" target="_blank" rel="noopener noreferrer" aria-label="X" className="rounded-full p-1.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://instagram.com/subin" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-full p-1.5 transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
