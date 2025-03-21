"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Badge } from "./badge"
import { Command, CommandGroup, CommandItem, CommandList } from "./command"

const MultiSelect = ({ options, selected, onChange, placeholder = "Select options...", className, ...props }) => {
  const inputRef = React.useRef(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = (item) => {
    onChange(selected.filter((i) => i !== item))
  }

  const handleKeyDown = (e) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          onChange(selected.slice(0, -1))
        }
      }
      // This is not a default behavior of the <input /> field
      if (e.key === "Escape") {
        input.blur()
      }
    }
  }

  const selectables = options.filter((option) => !selected.includes(option.value))

  return (
    <Command className={className} onKeyDown={handleKeyDown} {...props}>
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex gap-1 flex-wrap">
          {selected.map((item) => {
            const selectedOption = options.find((option) => option.value === item)
            return (
              <Badge key={item} variant="secondary">
                {selectedOption?.label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(item)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="placeholder:text-muted-foreground flex-1 bg-transparent outline-none"
            placeholder={selected.length === 0 ? placeholder : undefined}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
          />
        </div>
      </div>
      {open && selectables.length > 0 ? (
        <div className="relative">
          <CommandList className="absolute w-full z-10 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandGroup>
              {selectables.map((option) => (
                <CommandItem
                  key={option.value}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onSelect={() => {
                    onChange([...selected, option.value])
                    setInputValue("")
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </div>
      ) : null}
    </Command>
  )
}

export { MultiSelect }

