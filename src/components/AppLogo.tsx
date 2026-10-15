import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textMap = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Crisp Logo Emblem using the official app icon */}
      <div className={`relative ${sizeMap[size]} shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-blue-900/30 ring-1 ring-white/10 hover:scale-105 transition-transform duration-200`}>
        <img
          src="/icon.svg"
          alt="JasaDekat Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-extrabold tracking-tight text-white ${textMap[size]}`}>
              Jasa<span className="text-emerald-400">Dekat</span>
            </span>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ID
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
            Tukang & Teknisi Rumah Langsung WhatsApp
          </p>
        </div>
      )}
    </div>
  );
};
