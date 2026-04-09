"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onLoadingComplete: () => void;
  minDisplayTime?: number; // Minimum time to show splash screen (in ms)
}

export default function SplashScreen({
  onLoadingComplete,
  minDisplayTime = 2000,
}: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let hasMinTimePassed = false;
    let hasContentLoaded = false;

    // Ensure minimum display time
    const minTimeoutId = setTimeout(() => {
      hasMinTimePassed = true;
      if (hasContentLoaded) {
        startFadeOut();
      }
    }, minDisplayTime);

    // Check if document is already loaded
    if (document.readyState === "complete") {
      hasContentLoaded = true;
      if (hasMinTimePassed) {
        startFadeOut();
      }
    } else {
      // Listen for page load completion
      const handleLoad = () => {
        hasContentLoaded = true;
        if (hasMinTimePassed) {
          startFadeOut();
        }
      };

      window.addEventListener("load", handleLoad);

      // Cleanup
      return () => {
        window.removeEventListener("load", handleLoad);
        clearTimeout(timeoutId);
        clearTimeout(minTimeoutId);
      };
    }

    function startFadeOut() {
      setFadeOut(true);
      timeoutId = setTimeout(() => {
        setIsVisible(false);
        onLoadingComplete();
      }, 500); // Fade out duration
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(minTimeoutId);
    };
  }, [onLoadingComplete, minDisplayTime]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #000054 0%, #1a1a6e 100%)",
      }}
    >
      {/* Logo Container */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Logo */}
        <div
          className={`transform transition-all duration-1000 ease-out ${
            logoLoaded
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-95"
          }`}
        >
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48">
            <Image
              src="/assets/Benzard_Logo.png"
              alt="Benzard Sports Management"
              fill
              className="object-contain"
              priority
              onLoad={() => setLogoLoaded(true)}
              onError={() => setLogoLoaded(true)} // Still show animation even if logo fails to load
            />
          </div>
        </div>

        {/* Brand Name */}
        <div
          className={`text-center transform transition-all duration-1000 delay-300 ease-out ${
            logoLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Benzard Sports Management
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-blue-100 font-light">
            Building Champions from Grassroots to Glory
          </p>
        </div>

        {/* Loading Indicator */}
        <div
          className={`transform transition-all duration-1000 delay-500 ease-out ${
            logoLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-white rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Background Pattern (Optional) */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent transform rotate-12 scale-150"></div>
      </div>
    </div>
  );
}
