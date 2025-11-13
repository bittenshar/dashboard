// Backend API endpoint for UserVerificationCard component
// Add this to your Node.js backend

/*
// File: routes/userImageRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getSignedImageUrl, 
  checkObjectExists 
} = require('../utils/s3Utils'); // Your existing AWS S3 code

// Middleware for authentication
const authenticateToken = require('../middleware/auth');

// GET /api/users/:userId/image
// Get signed URL for user's image from S3
router.get('/:userId/image', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Generate S3 key based on your naming convention
    // Adjust this based on how you store user images
    const s3Key = `public/user-${userId}`;
    
    // Alternative key formats you might use:
    // const s3Key = `users/${userId}/profile.jpg`;
    // const s3Key = `public/user-${userId}-${faceId}`;

    // Check if image exists in S3
    const exists = await checkObjectExists(s3Key);
    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'User image not found'
      });
    }

    // Generate signed URL (expires in 1 hour)
    const signedUrl = await getSignedImageUrl(s3Key, 60 * 60);
    
    console.log(`[INFO] Generated signed URL for user ${userId}`);
    
    res.json({
      success: true,
      url: signedUrl,
      userId: userId,
      key: s3Key,
      expiresIn: '1 hour'
    });

  } catch (error) {
    console.error(`[ERROR] Failed to get image for user ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user image',
      error: error.message
    });
  }
});

// POST /api/users/:userId/image
// Upload new user image to S3 (optional enhancement)
router.post('/:userId/image', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const imageFile = req.files?.image;
    
    if (!userId || !imageFile) {
      return res.status(400).json({
        success: false,
        message: 'User ID and image file are required'
      });
    }

    // TODO: Implement S3 upload logic here
    // This would use your existing AWS S3 upload functions
    
    res.json({
      success: true,
      message: 'Image upload endpoint ready for implementation',
      userId: userId,
      fileName: imageFile.name
    });

  } catch (error) {
    console.error(`[ERROR] Failed to upload image for user ${req.params.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload user image',
      error: error.message
    });
  }
});

module.exports = router;
*/

// Usage in your main app.js:
/*
const userImageRoutes = require('./routes/userImageRoutes');
app.use('/api/users', userImageRoutes);
*/

// Example S3 key patterns you might use:
const S3_KEY_PATTERNS = {
  simple: (userId) => `public/user-${userId}`,
  withFaceId: (userId, faceId) => `public/user-${userId}-${faceId}`,
  organized: (userId) => `users/${userId}/profile.jpg`,
  timestamped: (userId, timestamp) => `users/${userId}/image-${timestamp}.jpg`
};

// Example response for successful API call:
const EXAMPLE_RESPONSE = {
  success: true,
  url: "https://nfacialimagescollections.s3.ap-south-1.amazonaws.com/public/user-507f1f77bcf86cd799439011?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
  userId: "507f1f77bcf86cd799439011",
  key: "public/user-507f1f77bcf86cd799439011",
  expiresIn: "1 hour"
};

console.log('Backend API endpoints created for UserVerificationCard component');

export { S3_KEY_PATTERNS, EXAMPLE_RESPONSE };
