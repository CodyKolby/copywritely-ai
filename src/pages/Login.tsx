
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState(false);
  const { user, signInWithGoogle } = useAuth();
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
      }
    };
    
    checkSupabaseConfig();
  }, []);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  if (configError) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-6">
        <div className="max-w-md mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription>
              <h3 className="font-bold mb-2">Supabase Configuration Error</h3>
              <p>The application could not connect to Supabase. Please make sure your environment variables are set correctly:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
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
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Copywrite
          </h1>
          <p className="text-gray-600">
            Sign in with Google to access your credits and tools
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-soft border border-gray-100"
        >
          <Button 
            variant="outline" 
            className="w-full mb-6 gap-2"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8"
        >
          <Alert className="bg-gray-50 border-copywrite-teal-light">
            <div className="flex items-start">
              <CreditCard className="h-5 w-5 text-copywrite-teal mr-3 mt-0.5" />
              <AlertDescription>
                <p className="font-medium text-gray-800">Premium Credits System</p>
                <p className="text-sm text-gray-600 mt-1">
                  After logging in, you can purchase credits to generate professional briefs and 
                  receive detailed AI analysis of your copy.
                </p>
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
