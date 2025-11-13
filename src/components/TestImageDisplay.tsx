import React, { useState, useEffect } from 'react';
import { buildUrl } from '@/constants/api/config';

const TestImageDisplay = () => {
  const [imageUrl, setImageUrl] = useState('');
  
  useEffect(() => {
    // Use centralized base URL
    fetch(buildUrl('/users/someUserId/image'), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.url) {
        setImageUrl(data.url);
        console.log('🖼️ Image URL received:', data.url);
      }
    })
    .catch(error => console.error('Error fetching image:', error));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h3>Test Image Display</h3>
      {imageUrl ? (
        <div>
          <p>URL: {imageUrl}</p>
          <img 
            src={imageUrl} 
            alt="Test"
            style={{ maxWidth: '200px', border: '2px solid #ddd' }}
            onError={(e) => {
              console.error('Image load error:', e);
              e.currentTarget.src = '/1.jpg';
            }}
          />
        </div>
      ) : (
        <p>Loading image...</p>
      )}
    </div>
  );
};

export default TestImageDisplay;
