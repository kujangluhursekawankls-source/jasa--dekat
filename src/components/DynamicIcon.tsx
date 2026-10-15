import React from 'react';
import * as Icons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-6 h-6', size = 24 }) => {
  if (!name) {
    return <Icons.Wrench className={className} size={size} />;
  }

  // Check if name is an image URL or base64 data URL
  if (name.startsWith('http://') || name.startsWith('https://') || name.startsWith('data:image/') || name.startsWith('/')) {
    return (
      <img
        src={name}
        alt=""
        className={`${className} object-cover rounded-lg`}
        onError={(e) => {
          // Fallback to Wrench icon if image fails to load
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (Icons as any)[name] || Icons.Wrench;
  return <IconComponent className={className} size={size} />;
};
