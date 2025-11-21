import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a single image to Supabase Storage
 * @param bucket - Storage bucket name (e.g., 'question-images')
 * @param file - Image blob or file
 * @param path - Path in the bucket (e.g., 'institution-id/question-id.jpg')
 * @returns Upload result with public URL
 */
export async function uploadImage(
  bucket: string,
  file: Blob | File,
  path: string
): Promise<ImageUploadResult> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (error) {
      console.error('Image upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Image upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple images in batch
 * @param bucket - Storage bucket name
 * @param files - Array of {file: Blob, path: string}
 * @returns Array of upload results
 */
export async function uploadImages(
  bucket: string,
  files: Array<{ file: Blob | File; path: string }>
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];

  for (const { file, path } of files) {
    const result = await uploadImage(bucket, file, path);
    results.push(result);
  }

  return results;
}

/**
 * Delete an image from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - Path in the bucket
 * @returns Success status
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Image deletion error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Image deletion exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete multiple images in batch
 * @param bucket - Storage bucket name
 * @param paths - Array of paths to delete
 * @returns Success status
 */
export async function deleteImages(
  bucket: string,
  paths: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      console.error('Batch image deletion error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Batch image deletion exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a unique file path for question images
 * @param institutionId - Institution ID
 * @param questionNumber - Question number
 * @param pageNumber - Page number
 * @param format - Image format (png or jpeg)
 * @returns Path string
 */
export function generateQuestionImagePath(
  institutionId: string,
  questionNumber: number,
  pageNumber: number,
  format: 'png' | 'jpeg' = 'jpeg'
): string {
  const timestamp = Date.now();
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `${institutionId}/q${questionNumber}_p${pageNumber}_${timestamp}.${extension}`;
}

/**
 * Check if a storage bucket exists, create if not
 * @param bucket - Bucket name
 * @returns Success status
 */
export async function ensureBucketExists(
  bucket: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to get bucket info
    const { data, error } = await supabase.storage.getBucket(bucket);

    if (error && error.message.includes('not found')) {
      // Bucket doesn't exist, create it
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png'],
      });

      if (createError) {
        console.error('Bucket creation error:', createError);
        return {
          success: false,
          error: createError.message,
        };
      }

      return {
        success: true,
      };
    }

    if (error) {
      console.error('Bucket check error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Bucket check exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
