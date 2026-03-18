import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-card w-full">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-2">
        <p className="text-sm text-muted-foreground">© 2026 SubIn. All rights reserved.</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
