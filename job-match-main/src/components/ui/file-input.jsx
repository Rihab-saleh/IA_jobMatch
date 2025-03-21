"use client"

import * as React from "react"
import { Upload } from "lucide-react"

import { cn } from "../lib/utils"

const FileInput = React.forwardRef(({ className, onChange, ...props }, ref) => {
  const [file, setFile] = React.useState(null)
  const fileInputRef = React.useRef(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    if (onChange) {
      onChange(selectedFile)
    }
  }

  const handleClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <label
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted/50"
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">{file ? file.name : "SVG, PNG, JPG or GIF (MAX. 2MB)"}</p>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} {...props} />
      </label>
    </div>
  )
})
FileInput.displayName = "FileInput"

export { FileInput }

