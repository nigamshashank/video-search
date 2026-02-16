// Presigned URL upload - no AWS SDK needed, uses native fetch API

/**
 * Upload a file to S3 using presigned URL
 * @param {File} file - The file to upload
 * @param {Object} presignedData - Presigned URL data from backend
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - The S3 path of the uploaded file
 */
export const upload_to_s3 = async (file, presignedData, onProgress) => {
  const { presigned_url, s3_path } = presignedData;

  if (!presigned_url) {
    throw new Error('Presigned URL not provided');
  }

  try {
    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);

    // For files up to 2GB, use simple PUT (S3 supports up to 5GB in single PUT)
    const use_simple_upload = file.size <= 2 * 1024 * 1024 * 1024;

    if (use_simple_upload) {
      // Simple PUT request with progress tracking using XMLHttpRequest
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) onProgress(100);
            resolve(s3_path);
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        xhr.open('PUT', presigned_url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(uint8Array);
      });
    } else {
      // Files larger than 2GB would require proper S3 multipart upload API
      // with backend support for CreateMultipartUpload and part URLs
      throw new Error('Files larger than 2GB are not currently supported');
    }
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Validate file before upload
 */
export const validate_video_file = (file) => {
  const max_size = 2 * 1024 * 1024 * 1024; // 2GB
  const allowed_types = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (file.size > max_size) {
    return { valid: false, error: 'File size exceeds 2GB limit' };
  }

  if (!allowed_types.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload MP4, WebM, OGG, or MOV' };
  }

  return { valid: true };
};
