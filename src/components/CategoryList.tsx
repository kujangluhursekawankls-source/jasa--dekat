import React from 'react';
import { Category } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { CheckCircle2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const activeCategories = categories.filter((c) => c.active !== false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>Kategori Jasa Populer</span>
          <span className="text-xs font-normal text-slate-500">
            ({activeCategories.length} Layanan)
          </span>
        </h2>
        {selectedCategoryId && (
          <button
            onClick={() => onSelectCategory('')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset Pilihan
          </button>
        )}
      </div>

      {/* Grid of categories with mobile horizontal scroll or responsive grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3.5">
        {activeCategories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? '' : cat.id)}
              className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border text-center transition-all group relative cursor-pointer active:scale-95 min-h-[92px] ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40 scale-[1.02]'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/50 shadow-2xs'
              }`}
            >
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 text-white">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-105 overflow-hidden ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {cat.icon && (cat.icon.startsWith('http://') || cat.icon.startsWith('https://') || cat.icon.startsWith('data:image/') || cat.icon.startsWith('/')) ? (
                  <img
                    src={cat.icon}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <DynamicIcon name={cat.icon} className="w-5 h-5" />
                )}
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2 ${
                isSelected ? 'text-white' : 'text-slate-800'
              }`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
