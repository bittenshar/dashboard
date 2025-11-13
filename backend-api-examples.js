// Backend API endpoint examples for S3 image handling
// These would be implemented in your Node.js backend

/*
// File: routes/imageRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSignedImageUrl, 
  checkObjectExists, 
  getMultipleSignedUrls 
} = require('../utils/s3Utils'); // Your AWS S3 code

// Middleware for authentication
const authenticateToken = require('../middleware/auth');

// POST /api/images/signed-url
// Generate a single signed URL for S3 object
router.post('/signed-url', authenticateToken, async (req, res) => {
  try {
    const { key, expiresIn = 3600 } = req.body;
    
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: 'S3 object key is required' 
      });
    }

    // Check if object exists first
    const exists = await checkObjectExists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in storage'
      });
    }

    // Generate signed URL
    const signedUrl = await getSignedImageUrl(key, expiresIn);
    
    res.json({
      success: true,
      signedUrl,
      expiresIn: `${Math.floor(expiresIn / 60)} minutes`,
      key
    });

  } catch (error) {
    console.error('[ERROR] Failed to generate signed URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate signed URL',
      error: error.message
    });
  }
});

// POST /api/images/multiple-signed-urls
// Generate multiple signed URLs with different expiration times
router.post('/multiple-signed-urls', authenticateToken, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: 'S3 object key is required' 
      });
    }

    // Check if object exists first
    const exists = await checkObjectExists(key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in storage'
      });
    }

    // Generate multiple signed URLs
    const urls = await getMultipleSignedUrls(key);
    
    res.json({
      success: true,
      ...urls,
      key
    });

  } catch (error) {
    console.error('[ERROR] Failed to generate multiple signed URLs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate multiple signed URLs',
      error: error.message
    });
  }
});

// POST /api/images/exists
// Check if an S3 object exists
router.post('/exists', authenticateToken, async (req, res) => {
  try {
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        message: 'S3 object key is required' 
      });
    }

    const exists = await checkObjectExists(key);
    
    res.json({
      success: true,
      exists,
      key
    });

  } catch (error) {
    console.error('[ERROR] Failed to check object existence:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check object existence',
      error: error.message
    });
  }
});

// POST /api/aadhaar/verify
// Placeholder for future Aadhaar verification API
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.body;
    const aadhaarImage = req.files?.aadhaar_image;
    
    if (!user_id || !aadhaarImage) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Aadhaar image are required'
      });
    }

    // TODO: Implement Aadhaar verification logic here
    // This is where you'll integrate with Aadhaar API in the future
    
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Aadhaar verification endpoint ready for integration',
      data: {
        userId: user_id,
        fileName: aadhaarImage.name,
        fileSize: aadhaarImage.size,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[ERROR] Aadhaar verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Aadhaar verification failed',
      error: error.message
    });
  }
});

module.exports = router;
*/

// Usage in your main app.js:
/*
const imageRoutes = require('./routes/imageRoutes');
app.use('/api/images', imageRoutes);
*/

export const BACKEND_API_EXAMPLES = `
The above code shows how to implement the backend API endpoints that work with your UserImageVerificationCard component.

Key endpoints:
1. POST /api/images/signed-url - Generate single signed URL
2. POST /api/images/multiple-signed-urls - Generate multiple signed URLs
3. POST /api/images/exists - Check if image exists
4. POST /api/aadhaar/verify - Placeholder for Aadhaar verification

These endpoints use your existing AWS S3 utility functions:
- getSignedImageUrl()
- checkObjectExists()  
- getMultipleSignedUrls()
`;

console.log('Backend API examples created for S3 image handling');
