const { v2: cloudinary } = require('cloudinary');

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();

const isConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function ensureCloudinaryConfigured() {
  if (isConfigured) return;
  const err = new Error(
    'Cloudinary не настроен. Укажите CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.'
  );
  err.code = 'CLOUDINARY_NOT_CONFIGURED';
  throw err;
}

function uploadBufferToCloudinary(buffer, options = {}) {
  ensureCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'burnout',
        resource_type: options.resource_type || 'auto',
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function uploadMulterFile(file, options = {}) {
  if (!file?.buffer) return '';
  const res = await uploadBufferToCloudinary(file.buffer, {
    folder: options.folder,
    resource_type: options.resource_type || 'auto',
  });
  return String(res?.secure_url || '');
}

async function uploadMulterFiles(files, options = {}) {
  const list = Array.isArray(files) ? files : [];
  const out = [];
  for (const file of list) {
    const url = await uploadMulterFile(file, options);
    if (url) out.push(url);
  }
  return out;
}

module.exports = {
  isCloudinaryConfigured: isConfigured,
  uploadMulterFile,
  uploadMulterFiles,
};

