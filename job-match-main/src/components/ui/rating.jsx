"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { cn } from "../lib/utils"

const Rating = ({ value = 0, max = 5, onChange, readOnly = false, className, ...props }) => {
  const [hoverValue, setHoverValue] = React.useState(null)

  const handleMouseEnter = (index) => {
    if (!readOnly) {
      setHoverValue(index)
    }
  }

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null)
    }
  }

  const handleClick = (index) => {
    if (!readOnly && onChange) {
      onChange(index)
    }
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className={cn("flex items-center", className)} onMouseLeave={handleMouseLeave} {...props}>
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1
        return (
          <Star
            key={index}
            className={cn(
              "w-5 h-5 cursor-pointer transition-colors",
              starValue <= displayValue ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground",
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            fill={starValue <= displayValue ? "currentColor" : "none"}
          />
        )
      })}
    </div>
  )
}

export { Rating }

