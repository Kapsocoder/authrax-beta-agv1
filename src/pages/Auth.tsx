
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
// import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) throw error;
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-glow overflow-hidden cursor-pointer" onClick={() => navigate("/")}>
              <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-1" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">Authrax</h1>
              <p className="text-muted-foreground">Personal Brand OS</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
            The Operating System for<br />
            <span className="text-gradient-primary">Your Professional Reputation</span>
          </h2>

          <p className="text-muted-foreground text-lg max-w-md">
            Build a personal brand that reflects your real expertise. Consistent, credible, and 100% you.
          </p>

          <div className="mt-12 space-y-4">
            {[
              "Capture your intent, not just your style",
              "LinkedIn-safe by design",
              "From rough notes to reputation",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-glow overflow-hidden cursor-pointer" onClick={() => navigate("/")}>
              <img src={logo} alt="Authrax Logo" className="w-full h-full object-cover p-1" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Authrax</h1>
          </div>


          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">
              Sign in to continue building your reputation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Social Auth - Hidden for Beta */}


          <p className="text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/waitlist")}
              className="text-primary hover:underline font-medium"
            >
              Join the beta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
