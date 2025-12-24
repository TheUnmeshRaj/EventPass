import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Save, Edit2, CheckCircle } from 'lucide-react';
import { updateUserProfile, getUserProfile, subscribeToUserProfile } from '../../lib/supabase/database';

export function UserDashboard({ authUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    government_id: '',
    id_type: 'aadhaar',
  });

useEffect(() => {
  const fetchProfile = async () => {
    if (!authUser?.id) return;
    
    try {
      setLoading(true);
      const profile = await getUserProfile(authUser.id);
      
      if (profile) {
        // Map profile data to formData structure
        setFormData({
          full_name: profile.full_name || '',
          email: profile.email || authUser.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
          government_id: profile.government_id || '',
          id_type: profile.id_type || 'aadhaar',
        });
      } else {
        // Fallback to auth user metadata only
        setFormData({
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
          email: authUser.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          government_id: '',
          id_type: 'aadhaar',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Set minimal data from auth user
      setFormData({
        full_name: authUser.user_metadata?.full_name || '',
        email: authUser.email || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        government_id: '',
        id_type: 'aadhaar',
      });
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();

  // Real-time subscription
  if (authUser?.id) {
    const subscription = subscribeToUserProfile(authUser.id, (updatedProfile) => {
      if (updatedProfile) {
        setFormData(prev => ({
          ...prev,
          full_name: updatedProfile.full_name || prev.full_name,
          phone: updatedProfile.phone || prev.phone,
          address: updatedProfile.address || prev.address,
          city: updatedProfile.city || prev.city,
          state: updatedProfile.state || prev.state,
          pincode: updatedProfile.pincode || prev.pincode,
          government_id: updatedProfile.government_id || prev.government_id,
          id_type: updatedProfile.id_type || prev.id_type,
        }));
      }
    });

    return () => subscription.unsubscribe();
  }
}, [authUser?.id]); // Only depend on authUser.id


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    console.log('Profile data:', profile);
  console.log('Auth user:', authUser);

    setSaving(true);
    setMessage(null);
    try {
      await updateUserProfile(authUser.id, formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-8">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
              <p className="text-slate-500">{formData.email}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Edit2 size={18} /> Edit Profile
            </button>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            <CheckCircle size={20} />
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Mail size={16} /> Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><Phone size={16} /> Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+91 XXXXX XXXXX"
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ID Type</label>
                <select
                  name="id_type"
                  value={formData.id_type}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                >
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Government ID Number</label>
                <input
                  type="text"
                  name="government_id"
                  value={formData.government_id}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter your government ID number"
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin size={20} /> Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Street address"
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 rounded-lg border ${isEditing ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={saving}
                
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                
              </button>
              
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
            
          )}
        </div>
        

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Security Note:</strong> Your personal information is encrypted and stored securely. We only use it for ticket verification and event management purposes.
          </p>
        </div>
      </div>
      
    </div>
    
  );
  
}
