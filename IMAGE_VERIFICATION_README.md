# User Image Verification Component

This component provides a comprehensive solution for verifying user images from S3 bucket and comparing them with Aadhaar card images.

## Files Created

### 1. `UserImageVerificationCard.tsx`
A React component that displays two image boxes side by side:
- **Left Box**: User uploaded image from S3 bucket with signed URL
- **Right Box**: Aadhaar card image upload (ready for future API integration)

### 2. `s3ImageService.ts`
Frontend service for handling S3 operations:
- Generate signed URLs
- Check if objects exist
- Handle multiple expiration times
- Parse S3 keys

### 3. `backend-api-examples.js`
Backend API endpoint examples that integrate with your AWS S3 code

## Features

### S3 Image Display
- ✅ Fetches images from S3 using signed URLs
- ✅ Handles different expiration times (15 min, 1 hour, 24 hours)
- ✅ Full-screen image preview
- ✅ Loading and error states
- ✅ Automatic URL refresh

### Aadhaar Integration Ready
- ✅ File upload with validation (type, size)
- ✅ Image preview functionality
- ✅ API-ready structure for future Aadhaar integration
- ✅ Error handling and user feedback

### User Interface
- ✅ Responsive design (mobile/desktop)
- ✅ Status badges (pending, verified, rejected)
- ✅ Action buttons (verify, reject)
- ✅ Professional card layout
- ✅ Toast notifications

## Integration with Your AWS Code

Your existing AWS S3 code works perfectly with this component:

```javascript
// Your existing code
const getSignedImageUrl = async (key, expiresIn = 60 * 60) => {
  const signedUrl = await s3.getSignedUrlPromise('getObject', {
    Bucket: "nfacialimagescollections",
    Key: key,
    Expires: expiresIn
  });
  return signedUrl;
};
```

The component calls your backend API which uses this function.

## Usage

### In UserVerificationPanel
The component is already integrated with a new "Images" button:

```tsx
<Button onClick={() => handleViewImageVerification(user)}>
  <Image className="h-4 w-4 mr-1" />
  Images
</Button>
```

### Standalone Usage
```tsx
import UserImageVerificationCard from './UserImageVerificationCard';

<UserImageVerificationCard
  user={userData}
  onVerify={(userId) => handleVerify(userId)}
  onReject={(userId) => handleReject(userId)}
  onImageUpdate={() => refreshData()}
/>
```

## Backend API Endpoints Needed

Implement these endpoints in your backend:

1. **POST `/api/images/signed-url`**
   ```javascript
   // Generate signed URL for S3 object
   { key: "public/user-123-abc", expiresIn: 3600 }
   ```

2. **POST `/api/images/exists`**
   ```javascript
   // Check if S3 object exists
   { key: "public/user-123-abc" }
   ```

3. **POST `/api/aadhaar/verify`** (Future)
   ```javascript
   // Process Aadhaar image verification
   FormData: { user_id, aadhaar_image }
   ```

## S3 Key Format

The component expects S3 keys in this format:
- `public/user-{userId}-{faceId}`
- Example: `public/user-507f1f77bcf86cd799439011-memrdvmn_rohit`

## Environment Variables

Make sure your backend has these AWS credentials:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-south-1
```

## Error Handling

The component handles various error states:
- ❌ Image not found in S3
- ❌ Network connectivity issues
- ❌ Invalid file uploads
- ❌ API authentication errors

## Future Aadhaar Integration

When ready to integrate Aadhaar API:

1. Update the `processAadhaarVerification()` function
2. Replace the placeholder API endpoint
3. Add Aadhaar-specific validation logic
4. Handle Aadhaar API responses

## Security Considerations

- ✅ Signed URLs expire automatically
- ✅ Authentication required for all API calls
- ✅ File type and size validation
- ✅ Secure token handling

## Component Props

```typescript
interface UserImageVerificationCardProps {
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    faceId?: string;
    uploadedPhoto?: string;
    aadhaarPhoto?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected';
  };
  onVerify?: (userId: string) => void;
  onReject?: (userId: string) => void;
  onImageUpdate?: () => void;
}
```

The component is production-ready and integrates seamlessly with your existing UserVerificationPanel and AWS S3 infrastructure.
