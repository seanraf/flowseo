
import { Session, User } from '@supabase/supabase-js';

export type UserTier = 'free' | 'limited' | 'unlimited';

export interface Profile {
  id: string;
  email: string;
  username?: string;
  tier: UserTier;
}

export interface TempUser {
  id: string;
  tier: UserTier;
}

export interface Subscription {
  subscribed: boolean;
  tier: UserTier;
  endDate: string | null;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tempUser: TempUser | null;
  isLoading: boolean;
  subscribed: boolean;
  subscriptionTier: UserTier;
  subscriptionEnd: string | null;
  signOut: () => Promise<void>;
  createTempUser: () => Promise<TempUser>;
  claimTempUser: (tempUserId: string) => Promise<void>;
  checkSubscription: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}
