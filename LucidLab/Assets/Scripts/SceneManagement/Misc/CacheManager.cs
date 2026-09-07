using System.IO;
using UnityEngine;

namespace Assets.SceneManagement.Misc {
    public static class CacheManager {
        public static byte[] GetFileFromCache(string fileName) {
            var path = Path.Combine(Application.persistentDataPath, fileName);
            return File.Exists(path) ? File.ReadAllBytes(path) : null;
        }

        public static void PutFileInCache(string fileName, byte[] file) {
            var fullPath = Path.Combine(Application.persistentDataPath, fileName);
            var directory = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(directory)) {
                Directory.CreateDirectory(directory);
            }
            File.WriteAllBytes(fullPath, file);
        }
    }
}
