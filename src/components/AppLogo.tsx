import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = "w-9 h-9", size }) => {
  return (
    <img
      src="/logo.svg"
      alt="Hungarian Algorithm Logo"
      className={`rounded-xl object-contain drop-shadow-md transition-transform hover:scale-105 select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
    />
  );
};
