import React, { useState, useEffect } from 'react';
import { RefreshCw, UserPlus, Copy, Check, Edit2, Key, Hash } from 'lucide-react';
import { getAllUsers, updateUserCommissionRate, setUserPassword, updateUserReferralCode } from './services/userService';
import { User } from './types';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showReferralCodeModal, setShowReferralCodeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(5);
  const [newPassword, setNewPassword] = useState<string>('');
  const [newReferralCode, setNewReferralCode] = useState<string>('');
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingReferralCode, setIsUpdatingReferralCode] = useState(false);
  const [referralCodeError, setReferralCodeError] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const loadedUsers = await getAllUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleRegisterClick = () => {
    window.location.href = '/register-user';
  };

  const openCommissionModal = (user: User) => {
    setSelectedUser(user);
    setNewCommissionRate(user.commissionRate || 5);
    setShowCommissionModal(true);
  };

  const closeCommissionModal = () => {
    setShowCommissionModal(false);
    setSelectedUser(null);
  };

  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
  };

  const openReferralCodeModal = (user: User) => {
    setSelectedUser(user);
    setNewReferralCode(user.referralCode);
    setReferralCodeError('');
    setShowReferralCodeModal(true);
  };

  const closeReferralCodeModal = () => {
    setShowReferralCodeModal(false);
    setSelectedUser(null);
    setNewReferralCode('');
    setReferralCodeError('');
  };

  const handleUpdateCommission = async () => {
    if (!selectedUser) return;
    
    setIsUpdatingCommission(true);
    try {
      await updateUserCommissionRate(selectedUser.id, newCommissionRate);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, commissionRate: newCommissionRate } 
          : user
      ));
      
      // Close the modal
      closeCommissionModal();
    } catch (error) {
      console.error('Error updating commission rate:', error);
      alert('Failed to update commission rate. Please try again.');
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await setUserPassword(selectedUser.id, newPassword);
      
      // Close the modal
      closePasswordModal();
      alert('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateReferralCode = async () => {
    if (!selectedUser || !newReferralCode) return;
    
    // Validate referral code
    if (newReferralCode.length < 5) {
      setReferralCodeError('Referral code must be at least 5 characters long');
      return;
    }
    
    // Check if the code contains only alphanumeric characters and hyphens
    if (!/^[a-zA-Z0-9\-]+$/.test(newReferralCode)) {
      setReferralCodeError('Referral code can only contain letters, numbers, and hyphens');
      return;
    }
    
    // Check if the code is already in use by another user
    const codeExists = users.some(user => 
      user.id !== selectedUser.id && user.referralCode === newReferralCode
    );
    
    if (codeExists) {
      setReferralCodeError('This referral code is already in use by another user');
      return;
    }
    
    setIsUpdatingReferralCode(true);
    setReferralCodeError('');
    
    try {
      await updateUserReferralCode(selectedUser.id, newReferralCode);
      
      // Update the user in the local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, referralCode: newReferralCode } 
          : user
      ));
      
      // Close the modal
      closeReferralCodeModal();
      alert('Referral code updated successfully');
    } catch (error) {
      console.error('Error updating referral code:', error);
      setReferralCodeError('Failed to update referral code. Please try again.');
    } finally {
      setIsUpdatingReferralCode(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Registered Users</h2>
        <div className="flex space-x-2">
          <button 
            onClick={loadUsers}
            disabled={isLoading}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm ${
              isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
          
          <button 
            onClick={handleRegisterClick}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg text-sm bg-green-600 hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4" />
            <span>New User</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-400">Loading users...</span>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Referral Code</th>
                    <th className="px-4 py-3">Referrals</th>
                    <th className="px-4 py-3">Commission</th>
                    <th className="px-4 py-3">Rate</th>
                    <th className="px-4 py-3">Registered</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className="font-mono mr-2">{user.referralCode}</span>
                          <button 
                            onClick={() => copyReferralCode(user.referralCode, user.id)}
                            className="p-1 rounded-md hover:bg-gray-700"
                            title="Copy referral code"
                          >
                            {copiedId === user.id ? 
                              <Check className="h-4 w-4 text-green-400" /> : 
                              <Copy className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{user.referrals}</td>
                      <td className="px-4 py-3">{user.totalCommission.toFixed(2)} TON</td>
                      <td className="px-4 py-3">{user.commissionRate || 5}%</td>
                      <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openReferralCodeModal(user)}
                            className="p-1 rounded-md text-yellow-400 hover:bg-gray-700 flex items-center"
                            title="Edit referral code"
                          >
                            <Hash className="h-4 w-4 mr-1" />
                            <span>Edit Code</span>
                          </button>
                          <button
                            onClick={() => openCommissionModal(user)}
                            className="p-1 rounded-md text-blue-400 hover:bg-gray-700 flex items-center"
                            title="Edit commission rate"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            <span>Edit Rate</span>
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="p-1 rounded-md text-purple-400 hover:bg-gray-700 flex items-center"
                            title="Set password"
                          >
                            <Key className="h-4 w-4 mr-1" />
                            <span>Set Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No users registered yet. Click "New User" to add one.
            </div>
          )}
        </div>
      )}

      {/* Commission Edit Modal */}
      {showCommissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Commission Rate</h3>
              <button 
                onClick={closeCommissionModal}
                className="text-gray-400 hover:text-white"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                User: <span className="text-white">{selectedUser.username}</span>
              </p>
              <p className="text-gray-400 mb-4">
                Current Rate: <span className="text-white">{selectedUser.commissionRate || 5}%</span>
              </p>
              
              <label className="block text-gray-400 mb-1">
                New Commission Rate (%)
              </label>
              <div className="flex items-center">
                <input 
                  type="number" 
                  value={newCommissionRate}
                  onChange={(e) => setNewCommissionRate(parseFloat(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span className="ml-2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This is the percentage of transaction amount the user will receive as commission for referrals.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeCommissionModal}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommission}
                disabled={isUpdatingCommission}
                className={`px-4 py-2 rounded-lg ${
                  isUpdatingCommission 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdatingCommission ? 'Updating...' : 'Update Rate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Set Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Set User Password</h3>
              <button 
                onClick={closePasswordModal}
                className="text-gray-400 hover:text-white"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-4">
                Setting password for: <span className="text-white">{selectedUser.username}</span>
              </p>
              
              <label className="block text-gray-400 mb-1">
                New Password
              </label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                placeholder="Enter new password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || !newPassword || newPassword.length < 6}
                className={`px-4 py-2 rounded-lg ${
                  isUpdatingPassword || !newPassword || newPassword.length < 6
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isUpdatingPassword ? 'Setting Password...' : 'Set Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Edit Modal */}
      {showReferralCodeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-5 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Referral Code</h3>
              <button 
                onClick={closeReferralCodeModal}
                className="text-gray-400 hover:text-white"
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                User: <span className="text-white">{selectedUser.username}</span>
              </p>
              <p className="text-gray-400 mb-4">
                Current Code: <span className="text-white font-mono">{selectedUser.referralCode}</span>
              </p>
              
              {referralCodeError && (
                <div className="bg-red-900/30 border border-red-800 text-red-300 px-3 py-2 rounded-lg mb-3 text-sm">
                  {referralCodeError}
                </div>
              )}
              
              <label className="block text-gray-400 mb-1">
                New Referral Code
              </label>
              <input 
                type="text" 
                value={newReferralCode}
                onChange={(e) => setNewReferralCode(e.target.value.toUpperCase())}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white font-mono"
                placeholder="Enter new referral code"
                minLength={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Referral code must be at least 5 characters long and can only contain letters, numbers, and hyphens.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeReferralCodeModal}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReferralCode}
                disabled={isUpdatingReferralCode || !newReferralCode || newReferralCode.length < 5}
                className={`px-4 py-2 rounded-lg ${
                  isUpdatingReferralCode || !newReferralCode || newReferralCode.length < 5
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {isUpdatingReferralCode ? 'Updating...' : 'Update Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;