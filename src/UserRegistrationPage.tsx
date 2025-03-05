import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Lock, User, Copy, Check } from 'lucide-react';
import { registerUser, setUserPassword } from './services/userService';

const UserRegistrationPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess(false);
    setReferralCode('');
    
    // Validate inputs
    if (!username || !password) {
      setError('All fields are required');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a unique email based on username
      const email = `${username.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@fastswap.com`;
      
      // Register user in Firebase
      const user = await registerUser(username, email);
      
      // Set password for the user
      await setUserPassword(user.id, password);
      
      // Show success message
      setSuccess(true);
      setReferralCode(user.referralCode);
      
      // Clear form
      setUsername('');
      setPassword('');
      
    } catch (error: any) {
      console.error('Error registering user:', error);
      setError(error.message || 'Failed to register user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${referralCode}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(getReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-900/30 p-3 rounded-full mb-4">
            <UserPlus className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Register New User</h1>
          <p className="text-gray-400 text-sm mt-1">Create a new user with a referral code</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {success && referralCode && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 px-4 py-3 rounded-lg mb-4">
            <p className="font-medium mb-2">User registered successfully!</p>
            <div className="mt-2">
              <p className="text-sm mb-1">Referral Code:</p>
              <div className="flex items-center bg-gray-800 rounded-lg p-2 mb-2">
                <span className="flex-1 font-mono">{referralCode}</span>
                <button 
                  onClick={copyReferralCode}
                  className="p-1 rounded-md hover:bg-gray-700"
                  title="Copy referral code"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              
              <p className="text-sm mb-1">Referral Link:</p>
              <div className="flex items-center bg-gray-800 rounded-lg p-2">
                <span className="flex-1 font-mono text-xs truncate">{getReferralLink()}</span>
                <button 
                  onClick={copyReferralLink}
                  className="p-1 rounded-md hover:bg-gray-700 ml-2"
                  title="Copy referral link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
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
                placeholder="Enter password"
                required
                minLength={6}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 6 characters long
            </p>
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
                Registering...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Register User
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
};

export default UserRegistrationPage;