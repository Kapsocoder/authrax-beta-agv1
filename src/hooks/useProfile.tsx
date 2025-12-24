import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles } from "lucide-react";

export interface Profile {
  id: string; // This will likely be the UID
  user_id: string;
  full_name: string | null;
  headline: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  linkedin_profile_url: string | null;
  linkedin_id: string | null;
  linkedin_linked_at: string | null;
  timezone: string | null;
  notification_preferences: Record<string, boolean> | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  subscription_tier: "free" | "pro";
  admin_overrides?: {
    bypass_limits?: boolean;
    custom_post_limit?: number;
  };
  voice_analysis_count?: number;
  weekly_usage: {
    count: number;
    start_date: string;
  };
  stripe_customer_id?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Ensure default values for new fields
        return {
          id: docSnap.id,
          subscription_tier: "free",
          weekly_usage: { count: 0, start_date: new Date().toISOString() },
          ...data
        } as Profile;
      }

      // If profile doesn't exist but user is logged in, return null (or create default?)
      // Supabase usually has a trigger. Firebase doesn't auto-create unless logic exists.
      // We will assume blank profile or null.
      return null;

    },
    enabled: !!user?.uid,
  });

  const profile = profileQuery.data;
  const isPro = profile?.subscription_tier === 'pro';
  const isAdminOverride = profile?.admin_overrides?.bypass_limits === true;
  const effectiveIsPro = isPro || isAdminOverride;

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.uid) throw new Error("Not authenticated");

      const docRef = doc(db, "users", user.uid);

      // Using setDoc with merge: true to handle case where profile doesn't exist yet
      await setDoc(docRef, {
        ...updates,
        user_id: user.uid,
        updated_at: new Date().toISOString()
      }, { merge: true });

      return { ...updates, user_id: user.uid } as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] });
      toast.success("Profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    },
  });

  const completeOnboarding = useMutation({
    mutationFn: async () => {
      if (!user?.uid) throw new Error("Not authenticated");

      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, { onboarding_completed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.uid] });
    },
  });

  const checkUsageLimit = () => {
    if (!profile) return true;
    if (effectiveIsPro) return true;

    const now = new Date();
    const usage = profile.weekly_usage || { count: 0, start_date: now.toISOString() };
    const startDate = new Date(usage.start_date);
    const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff >= 7) return true; // Will reset on next increment

    return usage.count < 1; // Strict 1 post limit for Free
  };

  const checkFeatureAccess = (feature: 'schedule' | 'voice_training' | 'trending_realtime' | 'recommendations_refresh' | 'analytics_history') => {
    if (effectiveIsPro) return true;

    switch (feature) {
      case 'schedule': return false; // Disabled for Free
      case 'trending_realtime': return false; // Disabled for Free
      case 'recommendations_refresh': return false; // Disabled for Free
      case 'analytics_history': return false; // Disabled for Free
      case 'voice_training':
        // 2 Lifetime limit
        const count = profile?.voice_analysis_count || 0;
        return count < 2;
      default: return false;
    }
  };

  const incrementUsage = useMutation({
    mutationFn: async () => {
      if (!user?.uid) return;
      const userRef = doc(db, 'users', user.uid);
      const now = new Date();
      const usage = profile?.weekly_usage || { count: 0, start_date: now.toISOString() };
      const startDate = new Date(usage.start_date);
      const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff >= 7) {
        await updateDoc(userRef, { weekly_usage: { count: 1, start_date: now.toISOString() } });
      } else {
        await updateDoc(userRef, { 'weekly_usage.count': increment(1) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.uid] });
    }
  });

  const isLinkedInLinked = !!(profileQuery.data?.linkedin_id || profileQuery.data?.linkedin_linked_at);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    updateProfile,
    completeOnboarding,
    isLinkedInLinked,
    needsOnboarding: profileQuery.data && !profileQuery.data.onboarding_completed,
    checkFeatureAccess,
    incrementUsage,
    checkUsageLimit,
    usageCount: profileQuery.data?.weekly_usage?.count || 0,
    subscriptionTier: profileQuery.data?.subscription_tier || 'free',
    isPro: effectiveIsPro
  };
}

export const SubscriptionBadge = ({ className }: { className?: string }) => {
  const { isPro, isLoading } = useProfile();

  if (isLoading) return null;

  if (isPro) {
    return (
      <Badge className={`gap-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0 ${className}`}>
        <Crown className="w-3 h-3 text-yellow-300 fill-yellow-300" />
        Pro
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`gap-1 ${className}`}>
      <Sparkles className="w-3 h-3 text-muted-foreground" />
      Free
    </Badge>
  );
};
