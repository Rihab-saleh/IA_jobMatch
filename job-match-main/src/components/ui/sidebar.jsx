"use client"

import * as React from "react"
import { cn } from "../lib/utils"

const SidebarContext = React.createContext({})

function useSidebarContext() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider")
  }
  return context
}

const SidebarProvider = React.forwardRef(({ children, ...props }, ref) => {
  return (
    <SidebarContext.Provider value={{}}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar-inset className={cn("flex-1 flex flex-col", className)} {...props} />
))
SidebarInset.displayName = "SidebarInset"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="header" className={cn("flex h-14 items-center border-b px-4", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="content" className={cn("flex-1 overflow-auto", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="group" className={cn("py-2", className)} {...props} />
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-label"
    className={cn("px-4 py-2 text-xs font-medium text-muted-foreground", className)}
    {...props}
  />
))
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="group-content" className={cn("", className)} {...props} />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="menu" className={cn("", className)} {...props} />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} data-sidebar="menu-item" className={cn("", className)} {...props} />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef(({ className, isActive, asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        isActive && "bg-accent text-accent-foreground",
        className,
      )}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-sidebar="input"
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
      "placeholder:text-muted-foreground",
      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
))
SidebarInput.displayName = "SidebarInput"

export {
  SidebarProvider,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInput,
  useSidebarContext,
}

