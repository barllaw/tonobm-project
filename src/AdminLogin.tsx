import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Admin password (in a real app, this would be handled securely)
  const ADMIN_PASSWORD = 'admin123';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a slight delay for better UX
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        onLogin(true);
      } else {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-900/30 p-3 rounded-full mb-4">
            <Lock className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your password to access the admin panel</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter admin password"
              required
              autoFocus
            />
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
                Verifying...
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
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            Return to Exchange
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;