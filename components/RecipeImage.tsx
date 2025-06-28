'use client';

import { useState, useEffect } from 'react';
import { Recipe, getImageUrlFromRecipe, shouldShowImageLoading } from '@/lib/types';

interface RecipeImageProps {
  recipe: Recipe;
  className?: string;
  onImageLoad?: () => void;
}

export default function RecipeImage({ recipe, className = "w-full h-48", onImageLoad }: RecipeImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(getImageUrlFromRecipe(recipe));
  const [showLoading, setShowLoading] = useState(shouldShowImageLoading(recipe));
  const [pollCount, setPollCount] = useState(0);

  // Poll for image updates if we should be showing loading
  useEffect(() => {
    if (!showLoading || imageUrl || pollCount >= 20) return; // Stop after 20 polls (10 minutes)

    const pollInterval = setInterval(async () => {
      try {
        // Fetch updated recipe data
        const response = await fetch(`/api/recipes/${recipe.id}`);
        if (response.ok) {
          const updatedRecipe = await response.json();
          const newImageUrl = getImageUrlFromRecipe(updatedRecipe);
          
          if (newImageUrl) {
            setImageUrl(newImageUrl);
            setShowLoading(false);
            onImageLoad?.();
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Error polling for image update:', error);
      }
      
      setPollCount(prev => prev + 1);
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [showLoading, imageUrl, recipe.id, pollCount, onImageLoad]);

  // Stop showing loading after 10 minutes
  useEffect(() => {
    if (pollCount >= 20) {
      setShowLoading(false);
    }
  }, [pollCount]);

  if (showLoading && !imageUrl) {
    return (
      <div className={`${className} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm font-medium">Generating image...</p>
          </div>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className={`${className} bg-gray-200`}>
        <img
          src={imageUrl}
          alt={`Image of ${recipe.name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Hide image if it fails to load and stop showing loading
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            setShowLoading(false);
          }}
          onLoad={() => {
            setShowLoading(false);
          }}
        />
      </div>
    );
  }

  return null; // No image and no loading state
}
