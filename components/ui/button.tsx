import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Loader2 } from 'lucide-react'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95 hover:scale-[1.02]',
                    {
                        'bg-primary-400 text-white hover:bg-primary-500 focus-visible:ring-primary-400 shadow-lg shadow-primary-400/20 hover:shadow-primary-400/30': variant === 'primary',
                        'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 focus-visible:ring-primary-400': variant === 'secondary',
                        'border border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 focus-visible:ring-secondary-400': variant === 'outline',
                        'hover:bg-secondary-100 text-secondary-600 hover:text-secondary-900': variant === 'ghost',
                        'bg-error text-white hover:bg-red-600 focus-visible:ring-error shadow-lg shadow-error/20': variant === 'danger',
                        'h-9 px-4 text-sm': size === 'sm',
                        'h-11 px-6 py-2': size === 'md',
                        'h-12 px-8 text-lg': size === 'lg',
                        'h-10 w-10': size === 'icon',
                    },
                    className
                )}
                type="button"
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = 'Button'

export { Button }
