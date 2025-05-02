
import React, { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface UserProfileFormProps {
  onSuccess?: () => void;
}

const UsernameSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50)
});

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      
      // Validate input
      const result = UsernameSchema.safeParse({ username });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      toast({
        title: "Update Failed",
        description: err.message || 'Failed to update profile',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user?.email || ''}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Your email cannot be changed.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your preferred username"
        />
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default UserProfileForm;
