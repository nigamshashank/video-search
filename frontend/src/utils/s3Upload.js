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

    // For files smaller than 100MB, use simple PUT
    const use_simple_upload = file.size < 100 * 1024 * 1024;

    if (use_simple_upload) {
      // Simple PUT request for smaller files
      if (onProgress) {
        onProgress(50); // Show 50% while uploading
      }

      const response = await fetch(presigned_url, {
        method: 'PUT',
        body: uint8Array,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed with status ${response.status}`);
      }

      if (onProgress) {
        onProgress(100); // Complete
      }
    } else {
      // Multipart upload for larger files using XMLHttpRequest for progress tracking
      const chunkSize = 5 * 1024 * 1024; // 5MB chunks
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = uint8Array.slice(start, end);

        const response = await fetch(presigned_url, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Type': file.type,
            'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
          },
        });

        if (!response.ok) {
          throw new Error(`S3 chunk upload failed at chunk ${i + 1}/${totalChunks}`);
        }

        // Update progress
        const progress = Math.round(((i + 1) / totalChunks) * 100);
        if (onProgress) {
          onProgress(progress);
        }
      }
    }

    console.log('✓ File uploaded successfully to S3');
    return s3_path;
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
