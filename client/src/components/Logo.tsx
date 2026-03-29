import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'donor' | 'ngo' | 'volunteer';
  showText?: boolean;
  collapsed?: boolean;
  className?: string;
}

export function Logo({ size = 'md', variant = 'donor', showText = true, collapsed = false, className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  const subTextSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-[13px]'
  };

  // Colors based on the new RescueBite branding
  // Primary Green: #22c55e (Emerald 500 equivalent)
  const colors = {
    iconBg: 'bg-green-500',
    iconText: 'text-white',
    whiteText: 'text-white', // For "Rescue"
    greenText: 'text-green-500', // For "Bite"
    subText: 'text-gray-400',
    shadow: 'shadow-green-500/20'
  };

  const getPortalName = () => {
    switch (variant) {
      case 'donor':
        return 'Donor Operations';
      case 'ngo':
        return 'Partner Portal';
      case 'volunteer':
        return 'Rescue Force';
      default:
        return 'Logistics Portal';
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 3D-effect Icon Container */}
      <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 hover:scale-110 hover:rotate-3 ${colors.iconBg} ${colors.shadow} border-b-4 border-green-700`}>
        <HeartHandshake className={`${colors.iconText} ${size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'}`} strokeWidth={2.5} />
      </div>

      {showText && !collapsed && (
        <div className="flex flex-col justify-center">
          <div className="flex items-baseline gap-0.5">
            <span className={`font-black tracking-tight ${textSizes[size]} leading-none drop-shadow-sm text-white`}>
              Rescue
            </span>
            <span className={`font-black tracking-tight ${textSizes[size]} leading-none drop-shadow-sm ${colors.greenText}`}>
              Bite
            </span>
          </div>
          <span className={`font-black uppercase tracking-[0.2em] mt-1 ${subTextSizes[size]} ${colors.subText}`}>
            {getPortalName()}
          </span>
        </div>
      )}
    </div>
  );
}
