import React, { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface NSFWPrediction {
  className: string;
  probability: number;
}

const ImageUploadWithNSFW: React.FC = () => {
  const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load NSFW model once on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true);
        console.log('Loading NSFW detection model...');
        const loadedModel = await nsfwjs.load();
        setModel(loadedModel);
        console.log('NSFW model loaded successfully');
      } catch (error) {
        console.error('Failed to load NSFW model:', error);
        showNotification('error', 'Failed to load content detection system');
      } finally {
        setLoading(false);
      }
    };

    loadModel();

    // Cleanup
    return () => {
      if (model) {
        tf.dispose();
      }
    };
  }, []);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const checkNSFWContent = async (file: File): Promise<boolean> => {
    if (!model) {
      throw new Error('NSFW model not loaded');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          // Run NSFW classification
          const predictions: NSFWPrediction[] = await model.classify(img);
          console.log('NSFW predictions:', predictions);

          // Check for inappropriate content (Porn or Hentai)
          const pornPrediction = predictions.find(p => p.className === 'Porn');
          const hentaiPrediction = predictions.find(p => p.className === 'Hentai');

          const isPorn = pornPrediction && pornPrediction.probability > 0.6;
          const isHentai = hentaiPrediction && hentaiPrediction.probability > 0.6;

          // Clean up
          URL.revokeObjectURL(objectUrl);
          tf.dispose();

          if (isPorn || isHentai) {
            resolve(false); // Not safe
          } else {
            resolve(true); // Safe
          }
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Reset previous state
    setPreview(null);
    setNotification(null);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showNotification('error', 'Please select a valid image file (JPG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showNotification('error', 'Image size must be less than 5MB');
      return;
    }

    if (!model) {
      showNotification('error', 'Content detection system not ready. Please wait.');
      return;
    }

    try {
      // Step 1: Check NSFW content
      setChecking(true);
      const isSafe = await checkNSFWContent(file);

      if (!isSafe) {
        showNotification('error', '⚠️ This image contains inappropriate content and cannot be posted');
        setChecking(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Step 2: Image is safe, show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setChecking(false);

      // Step 3: Upload to server
      await uploadImage(file);

    } catch (error) {
      console.error('Error processing image:', error);
      showNotification('error', 'Failed to process image. Please try again.');
      setChecking(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      showNotification('success', '✓ Image uploaded successfully!');
      
      // Reset file input after successful upload
      setTimeout(() => {
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Image</h2>
        <p className="text-sm text-gray-600">
          Images are automatically checked for inappropriate content
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : notification.type === 'error'
              ? 'bg-red-100 text-red-800 border border-red-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Loading model state */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Loading content detection system...</p>
        </div>
      )}

      {/* Upload button */}
      {!loading && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={checking || uploading}
          />
          
          <button
            onClick={handleButtonClick}
            disabled={checking || uploading || !model}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {checking || uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {checking ? 'Checking image safety...' : 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Choose Image
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Supported formats: JPG, PNG, GIF, WEBP (Max 5MB)
          </p>
        </div>
      )}

      {/* Image preview */}
      {preview && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-gray-700">Preview:</p>
          <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-50"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadWithNSFW;
