//controllers/mediaController.js
const MediaService = require('../services/media.service');

class MediaController {
  // Upload single image
  static async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image uploaded'
        });
      }

      // Validate file
      const validation = MediaService.validateImageFile(req.file);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'File validation failed',
          details: validation.errors
        });
      }

      const result = await MediaService.uploadImage(req.file, {
        folder: req.body.folder || 'uploads',
        type: req.body.type || 'general'
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);

      let statusCode = 500;
      let errorMessage = 'Image upload failed';

      if (error.message.includes('No file') ||
        error.message.includes('Invalid file type') ||
        error.message.includes('File size')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('Cloudinary')) {
        errorMessage = 'Image upload service error';
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No images uploaded'
        });
      }

      // Validate each file
      for (const file of req.files) {
        const validation = MediaService.validateImageFile(file);
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: 'File validation failed',
            details: validation.errors
          });
        }
      }

      const results = await MediaService.uploadMultipleImages(req.files, {
        folder: req.body.folder || 'batch_uploads'
      });

      res.status(200).json({
        success: true,
        data: results,
        message: `${results.length} image(s) uploaded successfully`
      });
    } catch (error) {
      console.error('Multiple upload error:', error);

      let statusCode = 500;
      let errorMessage = 'Image upload failed';

      if (error.message.includes('No files') ||
        error.message.includes('Maximum') ||
        error.message.includes('Invalid file type') ||
        error.message.includes('File size')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Crop image
  static async cropImage(req, res) {
    try {
      const { public_id, x, y, width, height } = req.body;

      if (!public_id || x === undefined || y === undefined || !width || !height) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: public_id, x, y, width, height'
        });
      }

      const result = await MediaService.cropImage(public_id, { x, y, width, height });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Image cropped successfully'
      });
    } catch (error) {
      console.error('Crop error:', error);

      let statusCode = 500;
      let errorMessage = 'Image cropping failed';

      if (error.message.includes('public ID') ||
        error.message.includes('Missing')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Delete image
  static async deleteImage(req, res) {
    try {
      const { public_id } = req.params;

      if (!public_id) {
        return res.status(400).json({
          success: false,
          error: 'Public ID is required'
        });
      }

      const result = await MediaService.deleteImage(public_id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete error:', error);

      let statusCode = 500;
      let errorMessage = 'Failed to delete image';

      if (error.message.includes('public ID')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Get image info
  static async getImageInfo(req, res) {
    try {
      const { public_id } = req.params;

      if (!public_id) {
        return res.status(400).json({
          success: false,
          error: 'Public ID is required'
        });
      }

      const result = await MediaService.getImageInfo(public_id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get info error:', error);

      let statusCode = 500;
      let errorMessage = 'Failed to get image information';

      if (error.message.includes('public ID') ||
        error.message.includes('not found')) {
        statusCode = 400;
        errorMessage = error.message;
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage
      });
    }
  }

  // Generate thumbnail
  static async generateThumbnail(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image uploaded'
        });
      }

      const result = await MediaService.generateThumbnail(req.file, {
        folder: req.body.folder || 'thumbnails'
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Thumbnail generated successfully'
      });
    } catch (error) {
      console.error('Thumbnail error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate thumbnail'
      });
    }
  }

  // Get optimized URL
  static async getOptimizedUrl(req, res) {
    try {
      const { public_id } = req.params;
      const { width, quality, format } = req.query;

      if (!public_id) {
        return res.status(400).json({
          success: false,
          error: 'Public ID is required'
        });
      }

      const url = MediaService.getOptimizedUrl(public_id, {
        width: width ? parseInt(width) : undefined,
        quality,
        format
      });

      res.status(200).json({
        success: true,
        data: { url }
      });
    } catch (error) {
      console.error('Optimized URL error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimized URL'
      });
    }
  }
}

module.exports = MediaController;