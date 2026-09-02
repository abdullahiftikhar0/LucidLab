import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseApp } from 'firebase/app';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only JPEG, PNG, WebP, and GIF images are accepted.';
  if (file.size > MAX_FILE_SIZE) return 'Image must be smaller than 2 MB.';
  return null;
}

export async function uploadAvatar(app: FirebaseApp, userId: string, file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);
  const storage = getStorage(app);
  const storageRef = ref(storage, `avatars/${userId}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}

export async function uploadCoverImage(app: FirebaseApp, classroomId: string, file: File): Promise<string> {
  const error = validateImage(file);
  if (error) throw new Error(error);
  const storage = getStorage(app);
  const storageRef = ref(storage, `classrooms/${classroomId}/cover`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
