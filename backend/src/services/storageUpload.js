const { getSupabaseAdmin } = require("./clients");

function decodeDataUrl(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!m) throw new Error("Invalid file payload");
  return { contentType: m[1], buffer: Buffer.from(m[2], "base64") };
}

async function uploadBuffer({ bucket, path, buffer, contentType = "model/gltf-binary", upsert = true }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert,
  });
  if (error) throw new Error(error.message || "Supabase upload failed");
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadBase64({ bucket, path, dataUrl, upsert = true }) {
  const { contentType, buffer } = decodeDataUrl(dataUrl);
  return uploadBuffer({ bucket, path, buffer, contentType, upsert });
}

module.exports = { decodeDataUrl, uploadBase64, uploadBuffer };
