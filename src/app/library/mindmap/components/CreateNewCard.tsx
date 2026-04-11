import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface CreateNewCardProps {
  onClick: () => void;
  idx?: number;
}

export const CreateNewCard = ({ onClick, idx = 0 }: CreateNewCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -4, borderColor: 'rgb(14 165 233)' }}
      className="group relative h-full min-h-48 bg-stone-50/50 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
      onClick={onClick}
    >
      <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:bg-sky-50 transition-all duration-300">
        <Plus size={24} className="text-stone-400 group-hover:text-sky-600" />
      </div>
      <span className="mt-4 text-xs font-bold text-stone-400 group-hover:text-sky-600 uppercase tracking-widest transition-colors font-mono">
        New Canvas
      </span>

      {/* Decorative corner dots */}
      <div className="absolute top-3 left-3 w-1 h-1 rounded-full bg-stone-200" />
      <div className="absolute bottom-3 right-3 w-1 h-1 rounded-full bg-stone-200" />
    </motion.div>
  );
};
