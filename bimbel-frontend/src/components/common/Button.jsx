import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// [PERBAIKAN 1] Bungkus dengan forwardRef agar bisa menerima 'ref' dari parent
export const Button = forwardRef(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left', // [PERBAIKAN 2] Ambil ini di sini agar tidak masuk ke '...props'
  loading = false,
  disabled = false,
  type = 'button',
  ...props // Sisa props (onClick, dll) akan diteruskan ke elemen <button>
}, ref) => {
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent shadow-sm',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500 border border-gray-300 shadow-sm',
    outline: 'bg-transparent text-blue-600 border-blue-200 hover:bg-blue-50 focus:ring-blue-500 border', // Update style outline
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 border border-transparent shadow-sm',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 border border-transparent shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref} // [PENTING] Teruskan ref ke elemen asli
      type={type}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props} // Spread sisa props yang aman
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className={clsx('w-4 h-4', children ? 'mr-2' : '')} />
      )}
      
      {children}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={clsx('w-4 h-4', children ? 'ml-2' : '')} />
      )}
    </button>
  );
});

// Nama display untuk devtools
Button.displayName = 'Button';