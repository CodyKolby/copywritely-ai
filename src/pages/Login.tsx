
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LogIn, User, KeyRound, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (isLogin) {
        toast.success('Successfully logged in!');
      } else {
        toast.success('Account created successfully!');
      }
    }, 1500);
  };

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
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-600">
            {isLogin 
              ? 'Log in to access your credits and tools' 
              : 'Sign up to start creating better copy'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-soft border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <Link to="/reset-password" className="text-sm text-copywrite-teal hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-copywrite-teal hover:bg-copywrite-teal-dark"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="ml-2">{isLogin ? 'Logging in...' : 'Creating account...'}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="mr-2" size={18} />
                  {isLogin ? 'Log in' : 'Create account'}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1.5 text-copywrite-teal hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
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
