
import { Session, User } from '@supabase/supabase-js';

export type UserTier = 'free' | 'limited' | 'unlimited';

export interface Profile {
  id: string;
  email: string;
  tier: UserTier;
}

export interface TempUser {
  id: string;
  tier: UserTier;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  tempUser: TempUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  createTempUser: () => Promise<TempUser>;
  claimTempUser: (tempUserId: string) => Promise<void>;
}
