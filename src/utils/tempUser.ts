
import { supabase } from '@/integrations/supabase/client';
import { UserTier } from '@/types/auth';

interface TempUserResponse {
  id: string;
  tier: UserTier;
}

export const createTempUser = async () => {
  try {
    const response = await supabase
      .from('temp_users')
      .insert({ tier: 'free' })
      .select()
      .single();
    
    if (response.error) throw response.error;
    
    const data = response.data as unknown as TempUserResponse;
    
    const newTempUser = { 
      id: data.id, 
      tier: data.tier as UserTier 
    };

    localStorage.setItem('tempUserId', newTempUser.id);
    return newTempUser;
  } catch (error) {
    console.error('Error creating temp user:', error);
    throw error;
  }
};

export const fetchTempUser = async (tempUserId: string) => {
  try {
    const response = await supabase
      .from('temp_users')
      .select('*')
      .eq('id', tempUserId)
      .single();
    
    if (response.error) throw response.error;
    
    const data = response.data as unknown as TempUserResponse;
    
    return { 
      id: data.id, 
      tier: data.tier as UserTier 
    };
  } catch (error) {
    console.error('Error loading temp user:', error);
    throw error;
  }
};

export const migrateTempUser = async (tempUserId: string, userId: string | null) => {
  try {
    const migrationParams = {
      temp_user_id: tempUserId,
      user_id: userId
    };

    const { error } = await supabase.functions.invoke('migrate-temp-user', {
      body: JSON.stringify(migrationParams)
    });

    if (error) throw error;
    localStorage.removeItem('tempUserId');
  } catch (error) {
    console.error('Error claiming temp user:', error);
    throw error;
  }
};
