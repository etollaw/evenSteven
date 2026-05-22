'use client'

import { Loader2 } from 'lucide-react'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const variants = {
  primary:
    'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 active:scale-95',
  secondary:
    'bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-95',
  ghost: 'hover:bg-gray-100 text-gray-700 active:scale-95',
  danger: 'bg-red-500 hover:bg-red-600 text-white shadow-sm shadow-red-200 active:scale-95',
  outline:
    'border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 active:scale-95',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center font-medium transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : icon ? (
          icon
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
