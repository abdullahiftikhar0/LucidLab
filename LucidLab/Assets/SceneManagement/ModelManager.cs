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
                return null;
            }

            var data = request.downloadHandler?.data;
            if (data == null || data.Length == 0) {
                return null;
            }

            return data;
        }

        private async Task<byte[]> TrySupabasePublicDownload(string modelName, string userName) {
            if (string.IsNullOrWhiteSpace(supabaseBaseUrl) || string.IsNullOrWhiteSpace(supabaseBucket)) {
                return null;
            }

            var baseUrl = supabaseBaseUrl.TrimEnd('/');
            var safeBucket = UnityWebRequest.EscapeURL(supabaseBucket);
            var safeUser = UnityWebRequest.EscapeURL(userName);
            var safeModel = UnityWebRequest.EscapeURL(modelName + ".glb");
            var url = $"{baseUrl}/storage/v1/object/public/{safeBucket}/{safeUser}/{safeModel}";

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
            var normalizedModelName = NormalizeModelName(modelName);
            if (string.IsNullOrWhiteSpace(normalizedModelName)) {
                Debug.LogError("[ModelManager] Model name is empty.");
                return null;
            }

            var users = GetCandidateUsernames();

            foreach (var user in users) {
                var scopedCacheKey = BuildUserScopedCacheKey(normalizedModelName, user);
                var cachedBytes = CacheManager.GetFileFromCache(scopedCacheKey);
                if (cachedBytes != null && cachedBytes.Length > 0) return cachedBytes;
            }

            byte[] bytes;

            if (trySupabaseFirst) {
                foreach (var user in users) {
                    bytes = await TrySupabasePublicDownload(normalizedModelName, user);
                    if (bytes != null) {
                        CacheManager.PutFileInCache(BuildUserScopedCacheKey(normalizedModelName, user), bytes);
                        Debug.Log($"[ModelManager] Loaded '{normalizedModelName}' from Supabase for user '{user}'.");
                        return bytes;
                    }
                }
            }

            foreach (var user in users) {
                bytes = await TryFirebaseStorageDownload(normalizedModelName, user);
                if (bytes != null) {
                    CacheManager.PutFileInCache(BuildUserScopedCacheKey(normalizedModelName, user), bytes);
                    Debug.Log($"[ModelManager] Loaded '{normalizedModelName}' from Firebase Storage for user '{user}'.");
                    return bytes;
                }
            }

            if (!trySupabaseFirst) {
                foreach (var user in users) {
                    bytes = await TrySupabasePublicDownload(normalizedModelName, user);
                    if (bytes != null) {
                        CacheManager.PutFileInCache(BuildUserScopedCacheKey(normalizedModelName, user), bytes);
                        Debug.Log($"[ModelManager] Loaded '{normalizedModelName}' from Supabase for user '{user}'.");
                        return bytes;
                    }
                }
            }

            Debug.LogError($"[ModelManager] Failed to load model '{normalizedModelName}'. Tried users: {string.Join(", ", users)}");
            return null;
        }
    }
}
