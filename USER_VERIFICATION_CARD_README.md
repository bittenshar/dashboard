# UserVerificationCard Component

A simplified React component that displays two image boxes for user verification - one for S3 stored images and one for Aadhaar card upload.

## ✨ Features

### 📸 **Two Image Display Boxes**
- **Left Box**: User uploaded image from S3 bucket
- **Right Box**: Aadhaar card local file upload (API ready for future integration)

### 🔐 **S3 Integration**
- ✅ Fetches images using signed URLs from your existing AWS S3 code
- ✅ Automatic loading states and error handling
- ✅ Secure token-based authentication

### 📄 **Aadhaar Ready**
- ✅ File upload with drag & drop interface
- ✅ File validation (type, size limits)
- ✅ Image preview functionality
- ✅ API endpoint ready for future Aadhaar verification

### 🎨 **User Interface**
- ✅ Clean, professional card design
- ✅ Responsive layout (mobile/desktop)
- ✅ Status badges (pending, verified, rejected)
- ✅ Action buttons (approve, reject)
- ✅ Toast notifications for user feedback

## 🚀 **Usage**

### Basic Implementation
```tsx
import UserVerificationCard from './UserVerificationCard';

<UserVerificationCard
  userId="507f1f77bcf86cd799439011"
  userName="John Doe"
  verificationStatus="pending"
  onVerify={() => handleVerifyUser()}
  onReject={() => handleRejectUser()}
/>
```

### Integrated with UserVerificationPanel
The component is already integrated! Click the "Images" button on any user card to open the verification modal.

## 🔧 **Props Interface**

```typescript
interface UserVerificationCardProps {
  userId: string;                                    // Required: User ID for fetching image
  userName?: string;                                 // Optional: Display name
  verificationStatus?: 'pending' | 'verified' | 'rejected'; // Optional: Current status
  onVerify?: () => void;                            // Optional: Verify callback
  onReject?: () => void;                            // Optional: Reject callback
}
```

## 🛠 **Backend Integration**

### Required API Endpoint

Create this endpoint in your Node.js backend:

```javascript
// GET /api/users/:userId/image
router.get('/:userId/image', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const s3Key = `public/user-${userId}`; // Adjust to your S3 naming convention
  
  const exists = await checkObjectExists(s3Key);
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Image not found' });
  }
  
  const signedUrl = await getSignedImageUrl(s3Key, 60 * 60); // 1 hour expiry
  
  res.json({
    success: true,
    url: signedUrl,
    userId: userId,
    expiresIn: '1 hour'
  });
});
```

### Works with Your Existing AWS Code

Your current S3 functions work perfectly:
```javascript
const getSignedImageUrl = async (key, expiresIn = 60 * 60) => {
  const signedUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: "nfacialimagescollections",
    Key: key,
    Expires: expiresIn
  });
  return signedUrl;
};
```

## 📁 **S3 Key Patterns**

The component supports various S3 key naming patterns:

```javascript
// Simple pattern (default)
`public/user-${userId}`

// With Face ID
`public/user-${userId}-${faceId}`

// Organized folders
`users/${userId}/profile.jpg`

// Timestamped
`users/${userId}/image-${timestamp}.jpg`
```

## 🔮 **Future Aadhaar Integration**

When ready to integrate Aadhaar verification API:

1. **Update the `handleProcessAadhaar` function**:
```typescript
const handleProcessAadhaar = async () => {
  // Replace with actual Aadhaar API call
  const response = await fetch('/api/aadhaar/verify', {
    method: 'POST',
    body: formData // Contains aadhaar_image and user_id
  });
};
```

2. **Create backend endpoint**:
```javascript
// POST /api/aadhaar/verify
router.post('/verify', async (req, res) => {
  // Integrate with Aadhaar verification service
  // Process uploaded image
  // Compare with user's face
  // Return verification result
});
```

## 🎯 **Component States**

### Loading States
- ⏳ User image loading from S3
- ⏳ Aadhaar processing (when implemented)

### Error Handling
- ❌ Image not found in S3
- ❌ Network connectivity issues
- ❌ Invalid file uploads (wrong type, too large)
- ❌ API authentication errors

### Success States
- ✅ User image loaded successfully
- ✅ Aadhaar file selected and previewed
- ✅ Verification actions completed

## 🔒 **Security Features**

- **Signed URLs**: Automatic expiration (1 hour default)
- **Authentication**: Bearer token required for all API calls
- **File Validation**: Type and size restrictions on uploads
- **CORS Protection**: Secure API endpoints

## 📱 **Responsive Design**

- **Desktop**: Side-by-side image layout
- **Mobile**: Stacked image layout
- **Touch Friendly**: Large buttons and tap targets

## 🔗 **Integration Points**

### With UserVerificationPanel
- ✅ Modal integration with "Images" button
- ✅ User data passed automatically
- ✅ Actions integrated with verification workflow

### Standalone Usage
- ✅ Can be used independently
- ✅ Minimal props required
- ✅ Self-contained functionality

## 📦 **Dependencies**

```json
{
  "react": "^18.0.0",
  "@/components/ui": "shadcn/ui components",
  "lucide-react": "icons",
  "@/hooks/use-toast": "toast notifications"
}
```

## 🚀 **Getting Started**

1. **Add the component** to your project (already done)
2. **Create the backend API endpoint** using the provided example
3. **Test with your S3 images** - it should work immediately
4. **Add Aadhaar integration** when your API is ready

The component is production-ready and will enhance your user verification workflow!
