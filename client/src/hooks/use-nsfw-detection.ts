import { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import { toast } from 'sonner';

interface NSFWPrediction {
  className: string;
  probability: number;
}

export const useNSFWDetection = () => {
  const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastPredictions, setLastPredictions] = useState<NSFWPrediction[] | null>(null);
  const modelLoadAttempted = useRef(false);

  useEffect(() => {
    // Only load once
    if (modelLoadAttempted.current) return;
    modelLoadAttempted.current = true;

    const loadModel = async () => {
      try {
        setIsLoading(true);
        console.log('[NSFW] Loading detection model...');
        const loadedModel = await nsfwjs.load();
        setModel(loadedModel);
        console.log('[NSFW] Model loaded successfully');
      } catch (error) {
        console.error('[NSFW] Failed to load model:', error);
        toast.error('Failed to load content detection system');
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();

    return () => {
      // Cleanup tensors on unmount
      tf.dispose();
    };
  }, []);

  const checkImage = async (imageSource: string | File): Promise<boolean> => {
    if (!model) {
      toast.error('Content detection system not ready');
      return false;
    }

    setIsChecking(true);

    try {
      return await new Promise<boolean>((resolve, reject) => {
        const img = new Image();
        let objectUrl: string | null = null;

        img.onload = async () => {
          try {
            // Run NSFW classification
            const predictions: NSFWPrediction[] = await model.classify(img);
            console.log('[NSFW] Predictions:', predictions);

            // Store predictions for later use
            setLastPredictions(predictions);

            // Check for inappropriate content (Porn or Hentai)
            const pornPrediction = predictions.find(p => p.className === 'Porn');
            const hentaiPrediction = predictions.find(p => p.className === 'Hentai');

            const isPorn = pornPrediction && pornPrediction.probability > 0.6;
            const isHentai = hentaiPrediction && hentaiPrediction.probability > 0.6;

            // Clean up
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            tf.dispose();

            if (isPorn || isHentai) {
              toast.error('⚠️ This image contains inappropriate content and cannot be posted');
              resolve(false); // Not safe
            } else {
              resolve(true); // Safe
            }
          } catch (error) {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            console.error('[NSFW] Classification error:', error);
            reject(error);
          }
        };

        img.onerror = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          reject(new Error('Failed to load image'));
        };

        // Handle both File objects and base64 strings
        if (imageSource instanceof File) {
          objectUrl = URL.createObjectURL(imageSource);
          img.src = objectUrl;
        } else {
          img.src = imageSource;
        }
      });
    } catch (error) {
      console.error('[NSFW] Check failed:', error);
      toast.error('Failed to verify image content. Please try again.');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    model,
    isLoading,
    isChecking,
    checkImage,
    lastPredictions,
  };
};
