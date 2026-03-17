import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import logo from "@/assets/subin-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <img src={logo} alt="SubIn" className="h-10 mb-8" />
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
        <p className="mt-4 text-xl font-semibold text-foreground">This page doesn't exist</p>
        <p className="mt-2 text-muted-foreground max-w-md">
          The page you're looking for may have been moved or removed. Let's get you back on track.
        </p>
        <Link to="/" className="mt-8">
          <Button size="lg">
            <Home className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
