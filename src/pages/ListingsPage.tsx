import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Calendar, DollarSign, ShieldCheck, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const mockListings = [
  {
    id: 1,
    title: "Sunny 2BR in Downtown",
    location: "Manhattan, NY",
    price: 2400,
    dates: "Jul 1 - Dec 31, 2026",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 2,
  },
  {
    id: 2,
    title: "Cozy Studio near Park",
    location: "Brooklyn, NY",
    price: 1800,
    dates: "Aug 1 - Nov 30, 2026",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 1,
  },
  {
    id: 3,
    title: "Modern 1BR with Views",
    location: "Jersey City, NJ",
    price: 2100,
    dates: "Jul 15 - Jan 15, 2027",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 1,
  },
  {
    id: 4,
    title: "Spacious 3BR Family Apt",
    location: "Queens, NY",
    price: 3200,
    dates: "Sep 1 - Feb 28, 2027",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 3,
  },
  {
    id: 5,
    title: "Artist Loft in Williamsburg",
    location: "Brooklyn, NY",
    price: 2600,
    dates: "Aug 15 - Dec 15, 2026",
    image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 1,
  },
  {
    id: 6,
    title: "Charming Brownstone Unit",
    location: "Park Slope, NY",
    price: 2900,
    dates: "Jul 1 - Oct 31, 2026",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
    approved: true,
    bedrooms: 2,
  },
];

const ListingsPage = () => {
  const [location, setLocation] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Browse Listings</h1>
          <p className="mt-2 text-muted-foreground">All listings are manager-approved and ready for verified subtenants</p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 flex flex-wrap gap-3 rounded-xl border bg-card p-4 shadow-card">
          <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <Select>
            <SelectTrigger className="w-[160px]">
              <DollarSign className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Price range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1500">Under $1,500</SelectItem>
              <SelectItem value="1500-2500">$1,500 - $2,500</SelectItem>
              <SelectItem value="2500+">$2,500+</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[160px]">
              <Calendar className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summer">Summer 2026</SelectItem>
              <SelectItem value="fall">Fall 2026</SelectItem>
              <SelectItem value="winter">Winter 2026-27</SelectItem>
            </SelectContent>
          </Select>
          <Button>Search</Button>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={`/listing/${listing.id}`} className="group block">
                <div className="overflow-hidden rounded-xl border bg-card shadow-card transition-all hover:shadow-elevated">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {listing.approved && (
                      <Badge variant="approved" className="absolute left-3 top-3 shadow-sm">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Manager Approved
                      </Badge>
                    )}
                    <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary">{listing.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {listing.location}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-primary">${listing.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {listing.dates}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;
