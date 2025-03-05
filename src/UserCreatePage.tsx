import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Mail, User, Lock } from 'lucide-react';
import { createUser } from './services/userService';

const UserCreatePage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess(false);
    
    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create user with authentication
      await createUser(username, email, password);
      
      // Show success message
      setSuccess(true);
      
      // Clear form
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/user-login';
      }, 3000);
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-900/30 p-3 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Sign up to track your referrals</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium">Account created successfully!</p>
            <p className="text-sm mt-1">Redirecting to login page...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

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
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="mb-4">
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
                placeholder="Create password"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || success}
            className={`w-full py-3 rounded-lg text-center font-medium flex items-center justify-center ${
              isLoading || success
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Creating Account...
              </>
            ) : success ? (
              'Account Created!'
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 mb-2">Already have an account?</p>
          <a
            href="/user-login"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Login to your account
          </a>
        </div>

        <div className="mt-4 text-center">
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

export default UserCreatePage;