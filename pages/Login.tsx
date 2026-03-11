
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !fullName.trim()) {
      showNotification("Please enter your full name.", "error");
      return;
    }
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters.", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = isSignUp 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              data: {
                full_name: fullName
              }
            }
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        showNotification(error.message, "error");
      } else if (isSignUp && data.user) {
        showNotification("Registration successful! Please check your email for verification.", "success");
      }
    } catch (err: any) {
      showNotification(err.message || 'An unexpected error occurred', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        showNotification(error.message, "error");
      }
    } catch (err: any) {
      showNotification(err.message || 'Google login failed', "error");
    } finally {
      setLoading(false);
    }
  };

  return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full h-screen flex flex-col items-center justify-center bg-background p-4"
      >
          <div className="text-center max-w-sm w-full">
              <div className="mx-auto w-20 h-20 mb-6 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                   <span className="material-symbols-outlined text-primary text-5xl">school</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
              <p className="text-zinc-400 mt-2">Enter your credentials to access your dashboard.</p>
              
              <form onSubmit={handleAuthAction} className="mt-8 space-y-4 text-left">
                {isSignUp && (
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                    required
                  />
                )}
                <input 
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                  required
                />
                 <input 
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all"
                  required
                />
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </motion.button>
              </form>

               <div className="flex items-center my-6">
                  <div className="flex-grow bg-border h-px"></div>
                  <span className="flex-shrink text-xs text-zinc-500 uppercase font-semibold px-4">OR</span>
                  <div className="flex-grow bg-border h-px"></div>
              </div>

              <div className="relative w-full group">
                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleLogin}
                    disabled={true}
                    className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-zinc-400 font-bold py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] opacity-70 cursor-not-allowed border border-zinc-700"
                >
                    <svg className="w-6 h-6 grayscale opacity-50" viewBox="0 0 48 48"><path fill="#4285F4" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    Sign in with Google
                </motion.button>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-xl">
                  <div className="bg-zinc-900/80 absolute inset-0 backdrop-blur-[1px]"></div>
                  <div className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase z-10 shadow-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">construction</span>
                    In Development
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-zinc-400 mt-8">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => { setIsSignUp(!isSignUp); }} className="font-bold text-primary ml-2 hover:underline">
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
          </div>
      </motion.div>
  );
};

export default Login;