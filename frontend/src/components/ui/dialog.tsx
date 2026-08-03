"use client"

import * as React from "react"
import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialog() {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("Dialog components must be used inside Dialog")
  return context
}

function Dialog({ children, open = false, onOpenChange }: React.PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
}>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = onOpenChange !== undefined
  const currentOpen = isControlled ? open : uncontrolledOpen
  const setOpen = (nextOpen: boolean) => {
    if (!isControlled) setUncontrolledOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  return (
    <DialogContext.Provider value={{ open: currentOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

function DialogTrigger({ children, ...props }: React.PropsWithChildren<React.ComponentProps<"div">>) {
  const { setOpen } = useDialog()
  return <div data-slot="dialog-trigger" onClick={() => setOpen(true)} {...props}>{children}</div>
}

function DialogContent({ className, children, showCloseButton = true, ...props }: React.PropsWithChildren<{
  className?: string
  showCloseButton?: boolean
}>) {
  const { open, setOpen } = useDialog()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={() => setOpen(false)}>
      <div
        data-slot="dialog-content"
        role="dialog"
        aria-modal="true"
        className={cn("relative w-full max-w-[calc(100%-2rem)] rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-xl sm:max-w-sm", className)}
        onMouseDown={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Button type="button" variant="ghost" className="absolute top-2 right-2" size="icon-sm" onClick={() => setOpen(false)}>
            <XIcon />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function DialogClose({ children, ...props }: React.PropsWithChildren<React.ComponentProps<"button">>) {
  const { setOpen } = useDialog()
  return <button type="button" onClick={() => setOpen(false)} {...props}>{children}</button>
}

function DialogPortal({ children }: React.PropsWithChildren) { return <>{children}</> }
function DialogOverlay({ className }: { className?: string }) { return <div className={cn("fixed inset-0 bg-black/40", className)} /> }
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("flex flex-col gap-2", className)} {...props} /> }
function DialogFooter({ className, children, ...props }: React.ComponentProps<"div">) { return <div className={cn("mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>{children}</div> }
function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) { return <h2 className={cn("text-base font-semibold", className)} {...props} /> }
function DialogDescription({ className, ...props }: React.ComponentProps<"p">) { return <p className={cn("text-sm text-muted-foreground", className)} {...props} /> }

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger }
