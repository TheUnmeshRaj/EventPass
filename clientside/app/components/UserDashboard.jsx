import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Save, Edit2, CheckCircle, Camera, AlertCircle } from 'lucide-react';
import {updateUserProfile,getUserProfile,subscribeToUserProfile,uploadUserAvatar,getUserAvatarUrl} from '../../lib/supabase/database';

export function UserDashboard({ authUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({full_name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '', government_id: '', id_type: 'aadhaar',});
  

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) return;

      try {
        setLoading(true);
        const profile = await getUserProfile(authUser.id);

        const avatarUrl = getUserAvatarUrl(authUser.id);
        setPreview(avatarUrl || null);

        if (profile) {
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
  }, [authUser?.email, authUser?.id, authUser?.user_metadata?.full_name, authUser?.user_metadata?.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const convertJpegToPng = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Conversion to PNG failed'));
              const fileName = file.name.replace(/\.jpe?g$/i, '.png');
              const pngFile = new File([blob], fileName, { type: 'image/png' });
              resolve(pngFile);
            }, 'image/png');
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = (err) => reject(err);
        img.src = reader.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let selectedFile = file;

    const isJpeg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
    if (isJpeg) {
      try {
        selectedFile = await convertJpegToPng(file);
      } catch (err) {
        console.error('Failed to convert JPEG to PNG:', err);
        setMessage({ type: 'error', text: 'Failed to convert JPEG image to PNG. Please try another image.' });
        return;
      }
    }

    setImageFile(selectedFile);
    if (preview) {
      try { URL.revokeObjectURL(preview); } catch (e) {}
    }
    setPreview(URL.createObjectURL(selectedFile));
  };
  const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


  const handleSave = async () => {
    console.log('Auth user:', authUser);
    setSaving(true);
    setMessage(null);

    try {
      if (imageFile && authUser?.id) {
        try {
          await uploadUserAvatar(authUser.id, imageFile);
          setPreview(getUserAvatarUrl(authUser.id));
          setImageFile(null); 
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          setMessage({
            type: 'error',
            text: 'Profile updated but avatar upload failed. Please try uploading the image again.'
          });
        }
      }
if (imageFile && authUser?.id) {
  try {
    const imageBase64 = await fileToBase64(imageFile);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/enroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: authUser.id,
        image: imageBase64,
      }),
    });
console.log('Enrollment response status:', res.status)
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Face enrollment failed");
    }

    alert("Face enrolled successfully ✅");
  } catch (err) {
    console.error(err);
    alert("Face enrollment failed ❌");
  }
}


      // Update profile
      await updateUserProfile(authUser.id, formData);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-200 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-emerald-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/6 backdrop-blur-lg border border-white/8 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <img
                src={preview || "/luffy.png"}
                alt="Avatar"
                onError={(e) => {
                  e.currentTarget.src = "/luffy.png";
                }}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-400/30"
              />


              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white mb-1">
                {formData.full_name || 'User Profile'}
              </h1>
              <p className="text-slate-300 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {formData.email}
              </p>
            </div>

            {/* Edit Button */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border backdrop-blur-sm ${message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white/6 backdrop-blur-lg border border-white/8 rounded-2xl shadow-xl p-8">
          {/* Personal Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-white/6 border border-white/10 text-slate-300 rounded-lg px-4 py-3 opacity-50 cursor-not-allowed"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="+91 1234567890"
                />
              </div>

              {/* ID Type */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  ID Type
                </label>
                <select
                  name="id_type"
                  value={formData.id_type}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>

              {/* Government ID */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Government ID Number
                </label>
                <input
                  type="text"
                  name="government_id"
                  value={formData.government_id}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="Enter your government ID"
                />
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="Street address"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="City"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="State"
                />
              </div>

              {/* Pincode */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-white/6 border border-white/10 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  placeholder="Pincode"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}