// ============================================
// src/components/common/LoadingSpinner.jsx
// ============================================
export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={clsx('animate-spin rounded-full border-b-2 border-blue-600', sizes[size])} />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};