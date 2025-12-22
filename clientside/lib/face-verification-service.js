'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const faceVerificationService = {
  /**
   * Store face image in Supabase Storage
   */
  async uploadFaceImage(imageBlob, userId) {
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `face-images/${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('face-images')
        .upload(filePath, imageBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      return {
        path: data.path,
        url: supabase.storage.from('face-images').getPublicUrl(data.path).data.publicUrl,
      };
    } catch (error) {
      console.error('Face image upload error:', error);
      throw new Error('Failed to upload face image');
    }
  },

  /**
   * Store face verification record in database
   */
  async logVerification(userId, verificationData, eventId = null) {
    try {
      const { data, error } = await supabase
        .from('face_verification_logs')
        .insert([
          {
            user_id: userId,
            event_id: eventId,
            verification_status: verificationData.verified ? 'verified' : 'failed',
            confidence_score: verificationData.confidence,
            matched_user_id: verificationData.matched_user ? userId : null,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Verification logging error:', error);
      throw new Error('Failed to log verification');
    }
  },

  /**
   * Get user's registered face images
   */
  async getUserFaceImages(userId) {
    try {
      const { data, error } = await supabase
        .from('face_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get face images error:', error);
      throw new Error('Failed to retrieve face images');
    }
  },

  /**
   * Register a new face for user
   */
  async registerUserFace(userId, imageBlob, isPrimary = false) {
    try {
      // Upload to storage
      const upload = await this.uploadFaceImage(imageBlob, userId);

      // If this is primary, update other faces to not be primary
      if (isPrimary) {
        await supabase
          .from('face_images')
          .update({ is_primary: false })
          .eq('user_id', userId);
      }

      // Insert record
      const { data, error } = await supabase
        .from('face_images')
        .insert([
          {
            user_id: userId,
            image_url: upload.url,
            image_path: upload.path,
            is_primary: isPrimary,
          },
        ])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Face registration error:', error);
      throw new Error('Failed to register face');
    }
  },

  /**
   * Get verification history for user
   */
  async getVerificationHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('face_verification_logs')
        .select('*')
        .eq('user_id', userId)
        .order('verified_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get verification history error:', error);
      throw new Error('Failed to retrieve verification history');
    }
  },
};
