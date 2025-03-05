import React, { useState } from 'react';
import { ArrowLeft, LogIn, Mail, Lock } from 'lucide-react';
import { loginUser } from './services/userService';

const UserLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate inputs
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Login user
      const success = await loginUser(email, password);
      
      if (success) {
        // Redirect to user dashboard
        window.location.href = '/user-dashboard';
      } else {
        setError('Invalid email or password');
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-900/30 p-3 rounded-full mb-4">
            <LogIn className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">User Login</h1>
          <p className="text-gray-400 text-sm mt-1">Access your referral dashboard</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-lg text-center font-medium flex items-center justify-center ${
              isLoading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-gray-400 hover:text-gray-300 text-sm flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Exchange
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;