"use client"

import React from "react"

// This component helps with image loading and fallbacks in React
// It's a simplified version of Next.js Image component
export function Image({ src, alt, width, height, className, fallbackSrc = "/placeholder.svg", ...props }) {
  const [imgSrc, setImgSrc] = React.useState(src)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    setImgSrc(src)
    setIsLoading(true)
    setError(false)
  }, [src])

  const handleError = () => {
    setError(true)
    setImgSrc(fallbackSrc)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // Create a fallback URL with dimensions
  const getFallbackUrl = () => {
    if (fallbackSrc.includes("placeholder.svg")) {
      return `${fallbackSrc}?height=${height || 100}&width=${width || 100}`
    }
    return fallbackSrc
  }

  return (
    <div
      className={`relative ${className || ""}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
      }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width: width ? `${width}px` : "100%", height: height ? `${height}px` : "100%" }}
        />
      )}
      <img
        src={error ? getFallbackUrl() : imgSrc}
        alt={alt || "Image"}
        width={width}
        height={height}
        onError={handleError}
        onLoad={handleLoad}
        className={`${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300 ${className || ""}`}
        {...props}
      />
    </div>
  )
}

