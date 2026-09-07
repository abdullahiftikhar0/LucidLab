using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Assets.Extensions;
using Assets.SceneManagement.Misc;
using Firebase.Storage;
using UnityEngine;
using UnityEngine.Networking;

namespace Assets.SceneManagement {
    public class ModelManager : MonoBehaviour {
        [Header("Model Source")]
        [Tooltip("Primary username folder for custom models. Defaults to Designer's current uploader identity.")]
        public string username = "mainuser";

        [Tooltip("Try Supabase public object URLs before Firebase Storage.")]
        public bool trySupabaseFirst = true;

        [Tooltip("Supabase project URL used by the Designer app.")]
        public string supabaseBaseUrl = "https://ibzcyatlycxxyecczmqw.supabase.co";

        [Tooltip("Public Supabase bucket where Designer uploads model files.")]
        public string supabaseBucket = "object-types";

        private FirebaseStorage _storage;

        private void EnsureStorage() {
            if (_storage == null) {
                _storage = FirebaseStorage.DefaultInstance;
            }
        }

        void Start() {
            EnsureStorage();
        }

        private List<string> GetCandidateUsernames() {
            var candidates = new List<string>();

            void AddCandidate(string value) {
                if (string.IsNullOrWhiteSpace(value)) return;
                var trimmed = value.Trim();
                if (trimmed.Length == 0) return;
                if (candidates.Contains(trimmed)) return;
                candidates.Add(trimmed);
            }

            AddCandidate(username);
            AddCandidate(PlayerPrefs.GetString("modelUsername", ""));
            AddCandidate(PlayerPrefs.GetString("designerUsername", ""));
            AddCandidate(PlayerPrefs.GetString("instructorId", ""));
            AddCandidate("mainuser");

            return candidates;
        }

        private async Task<byte[]> DownloadBytesFromUrl(string url) {
            if (string.IsNullOrWhiteSpace(url)) return null;

            using var request = UnityWebRequest.Get(url);
            await request.SendWebRequest();

            if (request.result != UnityWebRequest.Result.Success) {
                Debug.LogWarning($"[ModelManager] Download failed for URL: {url} | Error: {request.error}");
                return null;
            }

            var data = request.downloadHandler?.data;
            if (data == null || data.Length == 0) {
                Debug.LogWarning($"[ModelManager] Download succeeded but data is empty for URL: {url}");
                return null;
            }

            return data;
        }

        private async Task<byte[]> TrySupabasePublicDownload(string modelName, string userName) {
            if (string.IsNullOrWhiteSpace(supabaseBaseUrl) || string.IsNullOrWhiteSpace(supabaseBucket)) {
                return null;
            }

            var baseUrl = supabaseBaseUrl.TrimEnd('/');
            var safeBucket = Uri.EscapeDataString(supabaseBucket);
            var safeUser = Uri.EscapeDataString(userName);
            var safeModel = Uri.EscapeDataString(modelName + ".glb");
            var url = $"{baseUrl}/storage/v1/object/public/{safeBucket}/{safeUser}/{safeModel}";

            return await DownloadBytesFromUrl(url);
        }

        private static string BuildEncodedStoragePath(string storagePath) {
            if (string.IsNullOrWhiteSpace(storagePath)) return string.Empty;

            var segments = storagePath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < segments.Length; i++) {
                segments[i] = Uri.EscapeDataString(segments[i]);
            }

            return string.Join("/", segments);
        }

        private async Task<byte[]> TrySupabasePublicDownloadByPath(string storagePath) {
            if (string.IsNullOrWhiteSpace(supabaseBaseUrl) || string.IsNullOrWhiteSpace(supabaseBucket)) {
                return null;
            }

            var baseUrl = supabaseBaseUrl.TrimEnd('/');
            var safeBucket = Uri.EscapeDataString(supabaseBucket);
            var safePath = BuildEncodedStoragePath(storagePath);
            if (string.IsNullOrWhiteSpace(safePath)) {
                return null;
            }

            var url = $"{baseUrl}/storage/v1/object/public/{safeBucket}/{safePath}";
            return await DownloadBytesFromUrl(url);
        }

        private static string NormalizeModelName(string modelName) {
            var value = (modelName ?? string.Empty).Trim();
            if (value.EndsWith(".glb", StringComparison.OrdinalIgnoreCase)) {
                value = value[..^4];
            }

            return value;
        }

        private static string BuildUserScopedCacheKey(string modelName, string userName) {
            var safeUser = string.IsNullOrWhiteSpace(userName)
                ? "unknown"
                : userName.Trim().ToLowerInvariant();
            return $"{safeUser}/{modelName}.glb";
        }

        private async Task<byte[]> TryFirebaseStorageDownload(string modelName, string userName) {
            EnsureStorage();

            // Keep backward compatibility with both historical folder names.
            var prefixes = new[] { "object-types", "objectTypes" };

            foreach (var prefix in prefixes) {
                try {
                    var pathReference = _storage.GetReference($"{prefix}/{userName}/{modelName}.glb");
                    var downloadUrl = await pathReference.GetDownloadUrlAsync();
                    var bytes = await DownloadBytesFromUrl(downloadUrl.ToString());
                    if (bytes != null) return bytes;
                } catch {
                    // Ignore and continue trying fallbacks.
                }
            }

            return null;
        }

        public async Task<byte[]> GetModelBytes(string modelName) {
            if (Uri.TryCreate(modelName, UriKind.Absolute, out var absoluteUri)
                && (absoluteUri.Scheme == Uri.UriSchemeHttp || absoluteUri.Scheme == Uri.UriSchemeHttps)) {
                var directBytes = await DownloadBytesFromUrl(modelName);
                if (directBytes != null) {
                    CacheManager.PutFileInCache($"url/{modelName}", directBytes);
                    Debug.Log($"[ModelManager] Loaded custom model from direct URL: {modelName}");
                    return directBytes;
                }
            }

            var normalizedModelName = NormalizeModelName(modelName);
            if (string.IsNullOrWhiteSpace(normalizedModelName)) {
                Debug.LogError("[ModelManager] Model name is empty.");
                return null;
            }

            var hasScopedPath = normalizedModelName.Contains("/");
            var scopedPath = hasScopedPath ? normalizedModelName + ".glb" : null;
            var baseModelName = hasScopedPath
                ? normalizedModelName[(normalizedModelName.LastIndexOf('/') + 1)..]
                : normalizedModelName;

            if (hasScopedPath) {
                var scopedCacheKey = $"path/{scopedPath}";
                var scopedCachedBytes = CacheManager.GetFileFromCache(scopedCacheKey);
                if (scopedCachedBytes != null && scopedCachedBytes.Length > 0) {
                    return scopedCachedBytes;
                }

                var scopedBytes = await TrySupabasePublicDownloadByPath(scopedPath);
                if (scopedBytes != null) {
                    CacheManager.PutFileInCache(scopedCacheKey, scopedBytes);
                    Debug.Log($"[ModelManager] Loaded '{normalizedModelName}' using direct bucket path.");
                    return scopedBytes;
                }
            }

            var users = GetCandidateUsernames();

            foreach (var user in users) {
                var scopedCacheKey = BuildUserScopedCacheKey(baseModelName, user);
                var cachedBytes = CacheManager.GetFileFromCache(scopedCacheKey);
                if (cachedBytes != null && cachedBytes.Length > 0) return cachedBytes;
            }

            byte[] bytes;

            if (trySupabaseFirst) {
                foreach (var user in users) {
                    bytes = await TrySupabasePublicDownload(baseModelName, user);
                    if (bytes != null) {
                        CacheManager.PutFileInCache(BuildUserScopedCacheKey(baseModelName, user), bytes);
                        Debug.Log($"[ModelManager] Loaded '{baseModelName}' from Supabase for user '{user}'.");
                        return bytes;
                    }
                }
            }

            foreach (var user in users) {
                bytes = await TryFirebaseStorageDownload(baseModelName, user);
                if (bytes != null) {
                    CacheManager.PutFileInCache(BuildUserScopedCacheKey(baseModelName, user), bytes);
                    Debug.Log($"[ModelManager] Loaded '{baseModelName}' from Firebase Storage for user '{user}'.");
                    return bytes;
                }
            }

            if (!trySupabaseFirst) {
                foreach (var user in users) {
                    bytes = await TrySupabasePublicDownload(baseModelName, user);
                    if (bytes != null) {
                        CacheManager.PutFileInCache(BuildUserScopedCacheKey(baseModelName, user), bytes);
                        Debug.Log($"[ModelManager] Loaded '{baseModelName}' from Supabase for user '{user}'.");
                        return bytes;
                    }
                }
            }

            // Legacy fallback: model stored at bucket root without user scoping.
            bytes = await TrySupabasePublicDownloadByPath(baseModelName + ".glb");
            if (bytes != null) {
                CacheManager.PutFileInCache($"legacy/{baseModelName}.glb", bytes);
                Debug.Log($"[ModelManager] Loaded '{baseModelName}' from root bucket fallback path.");
                return bytes;
            }

            Debug.LogError($"[ModelManager] Failed to load model '{normalizedModelName}'. Tried users: {string.Join(", ", users)}");
            return null;
        }
    }
}
