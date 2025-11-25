"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Button } from "@/components/ui/button"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface AlertDialogContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined)

function useAlertDialog() {
    const context = React.useContext(AlertDialogContext)
    if (!context) {
        throw new Error("useAlertDialog must be used within a AlertDialogProvider")
    }
    return context
}

export function AlertDialog({
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
        <AlertDialogContext.Provider value={{ open: !!open, setOpen: setOpen || (() => { }) }}>
            {children}
        </AlertDialogContext.Provider>
    )
}

export function AlertDialogTrigger({
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
    const { setOpen } = useAlertDialog()

    const handleClick = (e: React.MouseEvent) => {
        onClick?.()
        setOpen(true)
    }

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as any, {
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

export function AlertDialogContent({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    const { open, setOpen } = useAlertDialog()
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
                {children}
            </div>
        </div>,
        document.body
    )
}

export function AlertDialogHeader({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
            {children}
        </div>
    )
}

export function AlertDialogFooter({
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

export function AlertDialogTitle({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <h2 className={cn("text-lg font-semibold text-neutral-graphite", className)}>
            {children}
        </h2>
    )
}

export function AlertDialogDescription({
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

export function AlertDialogAction({
    children,
    className,
    onClick,
    ...props
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    [key: string]: any
}) {
    const { setOpen } = useAlertDialog()

    const handleClick = (e: React.MouseEvent) => {
        onClick?.()
        setOpen(false) // Auto-close on action
    }

    return (
        <Button onClick={handleClick} className={cn(className)} {...props}>
            {children}
        </Button>
    )
}

export function AlertDialogCancel({
    children,
    className,
    onClick,
    ...props
}: {
    children: React.ReactNode
    className?: string
    onClick?: () => void
    [key: string]: any
}) {
    const { setOpen } = useAlertDialog()

    const handleClick = (e: React.MouseEvent) => {
        onClick?.()
        setOpen(false)
    }

    return (
        <Button variant="outline" onClick={handleClick} className={cn("mt-2 sm:mt-0", className)} {...props}>
            {children}
        </Button>
    )
}
