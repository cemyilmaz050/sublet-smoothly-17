import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Search, User, Mail, Phone, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const SignUpPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") as "tenant" | "subtenant" | null;
  const [selectedRole, setSelectedRole] = useState<"tenant" | "subtenant" | null>(initialRole);
  const [step, setStep] = useState(initialRole ? 2 : 1);

  const roles = [
    {
      id: "tenant" as const,
      icon: Home,
      title: "I'm a Current Tenant",
      description: "I want to sublet my apartment and find a verified subtenant",
    },
    {
      id: "subtenant" as const,
      icon: Search,
      title: "I'm looking for a place",
      description: "I want to browse approved sublets and apply as a subtenant",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Create your account</h1>
            <p className="mt-2 text-muted-foreground">
              {step === 1 ? "Choose how you'll use SubletSafe" : "Enter your details to get started"}
            </p>
          </div>

          {step === 1 && (
            <div className="mt-8 space-y-4">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    setSelectedRole(role.id);
                    setStep(2);
                  }}
                  className={cn(
                    "group w-full rounded-xl border-2 p-6 text-left transition-all hover:border-primary hover:bg-accent/50",
                    selectedRole === role.id ? "border-primary bg-accent/50" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <role.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{role.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 rounded-xl border bg-card p-8 shadow-card">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" className="mt-1.5" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="john@example.com" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Create a password" className="mt-1.5" />
                </div>
                <Button className="mt-2 w-full" size="lg">
                  Create Account
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
                <button
                  onClick={() => setStep(1)}
                  className="mt-2 w-full text-center text-sm text-muted-foreground hover:text-primary"
                >
                  ← Back to role selection
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SignUpPage;
