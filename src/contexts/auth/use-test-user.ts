
import { useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Profile } from './types'

export const useTestUser = () => {
  const [testUser, setTestUser] = useState<User | null>(null)
  const [testSession, setTestSession] = useState<Session | null>(null)
  const [testIsPremium, setTestIsPremium] = useState(false)
  const [testProfile, setTestProfile] = useState<Profile | null>(null)

  const setTestUserState = (loggedIn: boolean, premium: boolean = false) => {
    if (loggedIn) {
      const testUser = {
        id: 'test-user-id',
        app_metadata: {},
        user_metadata: {
          avatar_url: '',
          full_name: 'Test User'
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com',
        role: '',
        updated_at: new Date().toISOString()
      } as User;
      
      const testSession = {
        user: testUser,
        access_token: 'fake-token',
        refresh_token: 'fake-refresh-token',
        expires_at: Date.now() + 3600000,
      } as Session;
      
      setTestUser(testUser);
      setTestSession(testSession);
      setTestIsPremium(premium);
      setTestProfile({
        id: testUser.id,
        email: testUser.email,
        full_name: 'Test User',
        is_premium: premium,
        subscription_id: premium ? 'test-subscription-id' : undefined,
        subscription_status: premium ? 'active' : undefined,
        subscription_expiry: premium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined
      });
      toast.success(`Test user logged in (${premium ? 'Premium' : 'Free'} account)`);
    } else {
      setTestUser(null);
      setTestSession(null);
      setTestIsPremium(false);
      setTestProfile(null);
      toast.success('Test user logged out');
    }
  };

  return {
    testUser,
    testSession,
    testIsPremium,
    testProfile,
    setTestUserState
  }
}
