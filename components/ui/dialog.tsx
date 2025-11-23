"use client"

import * as React from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface DialogContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

function useDialog() {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider")
    }
    return context
}

export function Dialog({
    children,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
}: {
    children: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
}) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen

    return (
        <DialogContext.Provider value={{ open: !!open, setOpen: setOpen || (() => { }) }}>
            {children}
        </DialogContext.Provider>
    )
}

export function DialogTrigger({
    children,
    asChild,
    onClick,
    ...props
}: {
    children: React.ReactNode
    asChild?: boolean
    onClick?: () => void
    [key: string]: any
}) {
    const { setOpen } = useDialog()

    const handleClick = (e: React.MouseEvent) => {
        onClick?.()
        setOpen(true)
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, {
            onClick: handleClick,
            ...props,
        })
    }

    return (
        <button onClick={handleClick} {...props}>
            {children}
        </button>
    )
}

export function DialogContent({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    const { open, setOpen } = useDialog()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        if (open) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = "unset"
        }
        return () => {
            document.body.style.overflow = "unset"
        }
    }, [open])

    if (!mounted || !open) return null

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Dialog Panel */}
            <div className={cn("relative w-full max-w-lg transform rounded-xl bg-white p-6 shadow-2xl transition-all animate-slide-up", className)}>
                <button
                    onClick={() => setOpen(false)}
                    className="absolute right-4 top-4 rounded-full p-1 opacity-70 hover:bg-secondary-100 hover:opacity-100 transition-all"
                >
                    <X className="h-4 w-4 text-neutral-graphite" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>,
        document.body
    )
}

export function DialogHeader({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
            {children}
        </div>
    )
}

export function DialogFooter({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
            {children}
        </div>
    )
}

export function DialogTitle({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-neutral-graphite", className)}>
            {children}
        </h2>
    )
}

export function DialogDescription({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <p className={cn("text-sm text-secondary-500", className)}>
            {children}
        </p>
    )
}
