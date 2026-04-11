import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, ChevronRight, Share2, MoreVertical } from 'lucide-react';
import { MindMapThumbnail } from './MindMapThumbnail';
import { getIconComponent } from '@/lib/iconMap';

interface MindMapCardProps {
  map: any;
  idx: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  user: any;
}

export const MindMapCard = ({ map, idx, onOpen, onEdit, onDelete, user }: MindMapCardProps) => {
  const Icon = getIconComponent(map.icon);
  const nodeCount = map.nodes_data?.nodes?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative bg-white border border-stone-200 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:border-sky-200 transition-all duration-300"
      onClick={onOpen}
    >
      {/* Thumbnail Area */}
      <div className="relative h-32 w-full overflow-hidden">
        <MindMapThumbnail id={map.id} thumbnail={map.thumbnail} />
        
        {/* Hover Actions Overlay */}
        {user && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-500 hover:text-sky-600 hover:bg-white shadow-sm transition-all"
              title="编辑"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-stone-500 hover:text-red-600 hover:bg-white shadow-sm transition-all"
              title="删除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        
        {/* Mini Icon Tag */}
        <div className="absolute bottom-2 left-3 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
          <Icon size={16} className="text-stone-600" />
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-bold text-stone-800 group-hover:text-sky-600 transition-colors line-clamp-1">
            {map.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">{nodeCount} Nodes</span>
          <div className="w-1 h-1 rounded-full bg-stone-200" />
          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider line-clamp-1">
             {map.status || 'Draft'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
