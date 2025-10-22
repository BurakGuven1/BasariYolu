import { BookOpen } from 'lucide-react';

interface LogoProps {
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
}

export default function Logo({ 
  showText = true, 
  size = 'medium',
  className = '',
  onClick 
}: LogoProps) {
  const sizeClasses = {
    small: 'h-10 w-10',
    medium: 'h-14 w-14',  // Büyütüldü
    large: 'h-16 w-16'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  return (
    <div 
      className={`flex items-center cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <img 
        src="/Logom.png" 
        alt="BaşarıYolu Logo" 
        className={`${sizeClasses[size]} object-contain transition-all group-hover:scale-105`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = target.nextElementSibling;
          if (fallback) {
            fallback.classList.remove('hidden');
          }
        }}
      />
      
      {/* Fallback Icon */}
      <BookOpen className={`hidden ${sizeClasses[size]} text-blue-600`} />
      
      {/* Text */}
      {showText && (
        <span className={`ml-3 ${textSizeClasses[size]} font-bold text-gray-900 group-hover:text-blue-600 transition-colors`}>
          BaşarıYolu
        </span>
      )}
    </div>
  );
}