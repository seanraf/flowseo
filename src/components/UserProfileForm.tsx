
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

const DisplayInitialsSchema = z.object({
  display_initials: z.string()
    .min(1, 'Display initials must be at least 1 character')
    .max(2, 'Display initials cannot be more than 2 characters')
    .regex(/^[A-Za-z0-9]*$/, 'Only letters and numbers are allowed')
});

const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSuccess }) => {
  const { user, profile } = useAuth();
  const [displayInitials, setDisplayInitials] = useState(profile?.display_initials || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      
      // Validate input
      const result = DisplayInitialsSchema.safeParse({ display_initials: displayInitials });
      if (!result.success) {
        setError(result.error.errors[0].message);
        return;
      }

      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          display_initials: displayInitials,
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
        <Label htmlFor="display_initials">Display Initials</Label>
        <Input
          id="display_initials"
          value={displayInitials}
          onChange={(e) => setDisplayInitials(e.target.value.slice(0, 2).toUpperCase())}
          placeholder="Enter 1-2 characters"
          className="uppercase"
          maxLength={2}
        />
        <p className="text-xs text-muted-foreground">
          These initials will appear in your avatar. Maximum 2 characters.
        </p>
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
