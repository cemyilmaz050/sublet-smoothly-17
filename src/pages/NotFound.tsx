import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-32 text-center">
        <h1 className="text-7xl font-extrabold text-primary">404</h1>
        <p className="mt-4 text-xl font-semibold text-foreground">Page not found</p>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
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
