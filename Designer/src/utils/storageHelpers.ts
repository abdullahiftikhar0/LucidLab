import { supabase } from '../supabaseClient';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB final upload size
const MAX_SOURCE_FILE_SIZE = 15 * 1024 * 1024; // 15MB source file cap before compression
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, and GIF images are accepted.';
  if (file.size > MAX_SOURCE_FILE_SIZE) return 'Image must be smaller than 15 MB.';
  return null;
}

function validateProcessedImage(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'Image is still too large after compression. Please choose a smaller image.';
  }
  return null;
}

// Compress image before upload
function compressImage(file: File, maxSize: number = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to initialize image processing.'));
        return;
      }
      
      // Calculate new dimensions to reduce file size
      let { width, height } = img;
      const maxDimension = maxSize;
      
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to get under 2MB
      let quality = 0.8;
      let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // Keep reducing quality until under 2MB or minimum quality
      while (compressedDataUrl.length > 2 * 1024 * 1024 * 0.7 && quality > 0.1) {
        quality -= 0.1;
        compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      URL.revokeObjectURL(objectUrl);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image file.'));
    };

    img.src = objectUrl;
  });
}

// Generate unique file name
function generateFileName(userId: string, file: File): string {
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  return `${userId}_${timestamp}.${extension}`;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);

  // Compress image before upload
  const compressedFile = await compressImage(file, 600); // Max 600px for avatars
  const uploadFile = await dataUrlToFile(compressedFile);
  const processedError = validateProcessedImage(uploadFile);
  if (processedError) throw new Error(processedError);

  const fileName = generateFileName(userId, file);
  const filePath = `avatars/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, uploadFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true // Replace existing avatar
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    throw new Error('Failed to upload avatar');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Convert data URL to File
async function dataUrlToFile(dataUrl: string): Promise<File> {
  if (!dataUrl) throw new Error('Failed to process image for upload.');
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], 'compressed.jpg', { type: 'image/jpeg' });
}

export async function uploadCoverImage(classroomId: string, file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);

  // Compress image before upload
  const compressedFile = await compressImage(file, 1200); // Max 1200px for covers
  const uploadFile = await dataUrlToFile(compressedFile);
  const processedError = validateProcessedImage(uploadFile);
  if (processedError) throw new Error(processedError);

  const fileName = generateFileName(classroomId, file);
  const filePath = `classrooms/${classroomId}/cover/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('classroom-covers')
    .upload(filePath, uploadFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true // Replace existing cover
    });

  if (uploadError) {
    console.error('Cover image upload error:', uploadError);
    throw new Error('Failed to upload cover image');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('classroom-covers')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadExperimentThumbnail(experimentId: string, file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);

  // Compress image before upload
  const compressedFile = await compressImage(file, 1200); // Max 1200px for thumbnails
  const uploadFile = await dataUrlToFile(compressedFile);
  const processedError = validateProcessedImage(uploadFile);
  if (processedError) throw new Error(processedError);

  const fileName = generateFileName(experimentId, file);
  const filePath = `experiments/${experimentId}/thumbnail/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('experiment-thumbnails')
    .upload(filePath, uploadFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true // Replace existing thumbnail path when needed
    });

  if (uploadError) {
    console.error('Experiment thumbnail upload error:', uploadError);
    throw new Error('Failed to upload experiment thumbnail');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('experiment-thumbnails')
    .getPublicUrl(filePath);

  return publicUrl;
}

// Delete avatar when user updates
export async function deleteAvatar(userId: string, avatarUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `avatars/${fileName}`;
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Avatar deletion error:', error);
    }
  } catch (err) {
    console.error('Error deleting avatar:', err);
  }
}

// Delete cover image when classroom is updated
export async function deleteCoverImage(classroomId: string, coverUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = coverUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `classrooms/${classroomId}/cover/${fileName}`;
    
    const { error } = await supabase.storage
      .from('classroom-covers')
      .remove([filePath]);

    if (error) {
      console.error('Cover image deletion error:', error);
    }
  } catch (err) {
    console.error('Error deleting cover image:', err);
  }
}

// Delete experiment thumbnail when experiment is removed
export async function deleteExperimentThumbnail(experimentId: string, thumbnailUrl: string): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = thumbnailUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `experiments/${experimentId}/thumbnail/${fileName}`;

    const { error } = await supabase.storage
      .from('experiment-thumbnails')
      .remove([filePath]);

    if (error) {
      console.error('Experiment thumbnail deletion error:', error);
    }
  } catch (err) {
    console.error('Error deleting experiment thumbnail:', err);
  }
}

// Helper to generate initials from name (or email if name is empty)
export function generateInitials(name: string, email?: string): string {
  const source = (name || '').trim() || (email || '').trim();
  if (!source) return 'U';

  // If source looks like email (contains @), use first 2 chars of local part
  if (source.includes('@')) {
    const local = source.split('@')[0].trim();
    const initials = local.substring(0, 2).toUpperCase();
    return initials || 'U';
  }

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const initials = parts[0]?.substring(0, 2).toUpperCase();
  return initials || 'U';
}

// Helper to get avatar display info (emailFallback used when name is empty)
export function getAvatarDisplay(photoURL: string | null, name: string, size: 'sm' | 'md' | 'lg' = 'md', emailFallback?: string) {
  if (photoURL && photoURL.trim() !== '') {
    return { type: 'image', src: photoURL };
  }
  
  const initials = generateInitials(name, emailFallback);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs flex items-center justify-center',
    md: 'w-10 h-10 text-sm flex items-center justify-center',
    lg: 'w-12 h-12 text-base flex items-center justify-center'
  };
  
  return {
    type: 'initials',
    initials,
    className: sizeClasses[size]
  };
}
