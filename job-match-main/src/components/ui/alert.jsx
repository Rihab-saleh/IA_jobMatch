import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground border-muted-foreground/20",
        destructive:
          "border-destructive/30 text-destructive dark:border-destructive [&>svg]:text-destructive bg-destructive/10",
        warning:
          "border-yellow-500/30 text-yellow-700 dark:text-yellow-500 [&>svg]:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20",
        success:
          "border-green-500/30 text-green-700 dark:text-green-500 [&>svg]:text-green-600 bg-green-50 dark:bg-green-900/20",
        info: "border-blue-500/30 text-blue-700 dark:text-blue-500 [&>svg]:text-blue-600 bg-blue-50 dark:bg-blue-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5 ref={ref} className={cn("mb-1 font-semibold leading-none tracking-tight", className)} {...props} />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

