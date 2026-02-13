const cloudinary = require('../config/cloudinary');

class MediaService {
    // Upload image
    static async uploadImage(file, options = {}) {
        try {
            if (!file) {
                throw new Error('No file provided');
            }

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                throw new Error('Invalid file type. Only images are allowed.');
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                throw new Error('File size too large. Maximum size is 5MB.');
            }

            // Upload to Cloudinary with options
            const uploadOptions = {
                folder: options.folder || 'uploads',
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                transformation: options.transformation || [],
                ...options
            };

            // If it's an avatar, add specific transformations
            if (options.type === 'avatar') {
                uploadOptions.transformation = [
                    { width: 200, height: 200, crop: 'fill', gravity: 'face' },
                    { quality: 'auto', fetch_format: 'auto' }
                ];
            }

            const result = await cloudinary.uploader.upload(file.path, uploadOptions);

            return {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                created_at: result.created_at
            };
        } catch (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    // Delete image
    static async deleteImage(publicId) {
        try {
            if (!publicId) {
                throw new Error('No public ID provided');
            }

            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result !== 'ok') {
                throw new Error('Failed to delete image');
            }

            return { success: true, message: 'Image deleted successfully' };
        } catch (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }

    // Crop image
    static async cropImage(publicId, cropData) {
        try {
            const { x, y, width, height } = cropData;

            const result = await cloudinary.uploader.explicit(publicId, {
                type: 'upload',
                crop: `crop`,
                x: Math.floor(x),
                y: Math.floor(y),
                width: Math.floor(width),
                height: Math.floor(height)
            });

            return {
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height
            };
        } catch (error) {
            throw new Error(`Failed to crop image: ${error.message}`);
        }
    }

    // Resize image
    static async resizeImage(publicId, options) {
        try {
            const { width, height, crop = 'fill', quality = 'auto' } = options;

            const url = cloudinary.url(publicId, {
                width: Math.floor(width),
                height: Math.floor(height),
                crop,
                quality,
                fetch_format: 'auto'
            });

            return {
                url,
                public_id: publicId,
                width: Math.floor(width),
                height: Math.floor(height)
            };
        } catch (error) {
            throw new Error(`Failed to resize image: ${error.message}`);
        }
    }

    // Generate thumbnail
    static async generateThumbnail(file, options = {}) {
        try {
            const thumbnailOptions = {
                folder: options.folder || 'thumbnails',
                transformation: [
                    { width: 150, height: 150, crop: 'fill' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
                ...options
            };

            const result = await this.uploadImage(file, thumbnailOptions);

            return result;
        } catch (error) {
            throw new Error(`Failed to generate thumbnail: ${error.message}`);
        }
    }

    // Get image info
    static async getImageInfo(publicId) {
        try {
            const result = await cloudinary.api.resource(publicId);

            return {
                public_id: result.public_id,
                url: result.secure_url,
                format: result.format,
                bytes: result.bytes,
                width: result.width,
                height: result.height,
                created_at: result.created_at,
                tags: result.tags,
                context: result.context
            };
        } catch (error) {
            throw new Error(`Failed to get image info: ${error.message}`);
        }
    }

    // Upload multiple images
    static async uploadMultipleImages(files, options = {}) {
        try {
            if (!files || files.length === 0) {
                throw new Error('No files provided');
            }

            if (files.length > 10) {
                throw new Error('Maximum 10 files allowed per upload');
            }

            const uploadPromises = files.map(file =>
                this.uploadImage(file, { ...options, folder: options.folder || 'batch_uploads' })
            );

            const results = await Promise.all(uploadPromises);

            return results;
        } catch (error) {
            throw new Error(`Failed to upload multiple images: ${error.message}`);
        }
    }

    // Validate image file
    static validateImageFile(file) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            errors.push('Invalid file type. Allowed types: JPEG, PNG, GIF, WebP');
        }

        // Check file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('File size exceeds 5MB limit');
        }

        // Check dimensions if needed
        if (file.dimensions) {
            const { width, height } = file.dimensions;
            const maxDimension = 5000;

            if (width > maxDimension || height > maxDimension) {
                errors.push(`Image dimensions exceed ${maxDimension}x${maxDimension} limit`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Generate optimized image URL
    static getOptimizedUrl(publicId, options = {}) {
        const defaultOptions = {
            width: 800,
            quality: 'auto',
            fetch_format: 'auto'
        };

        const mergedOptions = { ...defaultOptions, ...options };

        return cloudinary.url(publicId, mergedOptions);
    }
}

module.exports = MediaService;