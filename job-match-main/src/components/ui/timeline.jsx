import { cn } from "../lib/utils"

const Timeline = ({ className, children, ...props }) => {
  return (
    <div className={cn("space-y-8", className)} {...props}>
      {children}
    </div>
  )
}

const TimelineItem = ({ className, children, ...props }) => {
  return (
    <div className={cn("relative pl-8", className)} {...props}>
      <div className="absolute left-0 top-1 h-4 w-4 rounded-full border border-primary bg-background"></div>
      <div className="absolute left-2 top-5 h-full w-[1px] bg-border"></div>
      {children}
    </div>
  )
}

const TimelineItemTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn("font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

const TimelineItemDescription = ({ className, children, ...props }) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

const TimelineItemContent = ({ className, children, ...props }) => {
  return (
    <div className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  )
}

export { Timeline, TimelineItem, TimelineItemTitle, TimelineItemDescription, TimelineItemContent }

