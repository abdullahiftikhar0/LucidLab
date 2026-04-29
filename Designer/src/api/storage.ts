import { apiRequest } from './http/client';

export async function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

export async function uploadAvatarApi(userId: string, file: File) {
  const fileDataUrl = await fileToDataUrl(file);
  return apiRequest<{ publicUrl: string; path: string }>('POST', '/api/storage/avatar', {
    userId,
    fileName: file.name,
    fileDataUrl,
  });
}

export async function uploadCoverApi(classroomId: string, file: File) {
  const fileDataUrl = await fileToDataUrl(file);
  return apiRequest<{ publicUrl: string; path: string }>(
    'POST',
    '/api/storage/classroom-cover',
    {
      classroomId,
      fileName: file.name,
      fileDataUrl,
    },
  );
}

export async function uploadExperimentThumbnailApi(experimentId: string, file: File) {
  const fileDataUrl = await fileToDataUrl(file);
  return apiRequest<{ publicUrl: string; path: string }>(
    'POST',
    '/api/storage/experiment-thumbnail',
    {
      experimentId,
      fileName: file.name,
      fileDataUrl,
    },
  );
}

export async function uploadObjectTypeApi(objectName: string, file: Blob) {
  const fileDataUrl = await fileToDataUrl(file);
  return apiRequest<{ publicUrl: string; path: string }>('POST', '/api/storage/object-types', {
    objectName,
    fileDataUrl,
  });
}

export async function listObjectTypesApi() {
  return apiRequest<{ items: { id: string; name: string; url: string }[] }>(
    'GET',
    '/api/storage/object-types',
  );
}

export async function uploadMarkerApi(markerId: string, file: Blob) {
  const fileDataUrl = await fileToDataUrl(file);
  return apiRequest<{ publicUrl: string; path: string }>('POST', '/api/storage/markers', {
    markerId,
    fileDataUrl,
  });
}

export async function listMarkersApi() {
  return apiRequest<{ items: { id: string; name: string; imageUrl: string }[] }>(
    'GET',
    '/api/storage/markers',
  );
}

export async function deleteStoragePathApi(bucket: string, path: string) {
  return apiRequest<{ ok: boolean }>('DELETE', `/api/storage/${bucket}/${path}`);
}
