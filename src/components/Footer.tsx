import { Link } from "react-router-dom";
import logo from "@/assets/subin-logo.png";

const Footer = () => {
  return (
    <footer className="border-t bg-card/50">
      <div className="container px-4 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="SubIn" className="h-6" />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} SubIn. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <a href="mailto:hello@subinapp.com" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
