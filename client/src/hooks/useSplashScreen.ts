'use client';

import { useState, useEffect } from 'react';

interface UseSplashScreenOptions {
  minDisplayTime?: number;
  enabled?: boolean;
}

export function useSplashScreen({ 
  enabled = true 
}: UseSplashScreenOptions = {}) {
  const [isLoading, setIsLoading] = useState(enabled);
  const [showSplash, setShowSplash] = useState(enabled);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowSplash(false);
    }, 100);
  };

  // Disable splash screen for certain routes if needed
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setShowSplash(false);
    }
  }, [enabled]);

  return {
    isLoading,
    showSplash,
    handleLoadingComplete,
  };
}
