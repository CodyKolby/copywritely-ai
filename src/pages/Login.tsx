
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const { user, signInWithGoogle, refreshSession } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Supabase is properly configured
    const checkSupabaseConfig = async () => {
      try {
        // Try to make a simple request to verify connection
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && error.message.includes('Failed to fetch')) {
          setConfigError(true);
          console.error('Supabase connection error:', error);
        }
      } catch (err) {
        setConfigError(true);
        console.error('Error checking Supabase configuration:', err);
      } finally {
        setInitializing(false);
      }
    };
    
    checkSupabaseConfig();
  }, []);
    
  // Handle auth callback parameters
  useEffect(() => {
    const handleAuthCallback = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const queryParams = new URLSearchParams(url.search);
      
      // Check for auth provider callbacks
      if ((hashParams.has('access_token') || queryParams.has('code'))) {
        console.log('[LOGIN] Auth callback detected, setting loading state');
        setLoading(true);
        
        try {
          // Get session to check if user is logged in after redirect
          const { data, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (data?.session?.user) {
            console.log('[LOGIN] Auth callback successful, user authenticated:', data.session.user.id);
            
            // Store user metadata for debugging
            console.log('[LOGIN] User data:', {
              id: data.session.user.id,
              email: data.session.user.email,
              metadata: data.session.user.user_metadata
            });
            
            setTimeout(async () => {
              try {
                await refreshSession();
                toast.success('Successfully authenticated! Redirecting...');
                navigate('/');
              } catch (err) {
                console.error('[LOGIN] Error refreshing session:', err);
              }
            }, 1000);
          } else {
            console.log('[LOGIN] Auth callback processed but no session found');
          }
        } catch (err) {
          console.error('[LOGIN] Error processing auth callback:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (!initializing) {
      handleAuthCallback();
    }
  }, [initializing, refreshSession, navigate]);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      console.log('[LOGIN] User already logged in, redirecting to home', user.id);
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    // Don't set loading to false, as we're being redirected
  };

  if (configError) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <h3 className="font-bold mb-2">Supabase Configuration Error</h3>
              <p>The application could not connect to Supabase. Please make sure your environment variables are set correctly.</p>
              <p className="mt-2">Check the browser console for more details.</p>
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row bg-white rounded-xl overflow-hidden shadow-xl max-w-5xl mx-auto">
          {/* Left Section - Login */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Zaloguj się
            </h1>
            <p className="text-gray-600 mb-8">
              Witaj w Copility — zaloguj się, aby kontynuować
            </p>

            <Button 
              variant="outline" 
              className="w-full gap-2 py-6 text-base font-medium"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-copywrite-teal"></div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    <path d="M1 1h22v22H1z" fill="none"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
            
            {loading && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Trwa logowanie, proszę czekać...
              </p>
            )}
          </motion.div>
          
          {/* Right Section - Image */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full md:w-1/2 flex items-center justify-center p-6"
          >
            <div className="rounded-xl overflow-hidden w-full h-full">
              <img 
                src="/lovable-uploads/d82eeba7-f4a8-4627-ad06-d7964bfde25c.png" 
                alt="Copility login illustration" 
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Add TypeScript declaration for auth callback tracking
declare global {
  interface Window {
    authCallbackProcessed?: boolean;
  }
}

export default Login;
