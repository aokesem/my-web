import React from 'react';
import { motion } from 'framer-motion';
import { Star, Search, Clock, ExternalLink, Bookmark, Edit, Trash2 } from 'lucide-react';
import { InfoItem } from '../types';
import { SafeDeleteDialog } from '@/components/ui/safe-delete-dialog';

interface InfoCardProps {
    item: InfoItem;
    theme: any;
    isStudy: boolean;
    displayImage?: string;
    sourceName?: string;
    sourceImg?: string;
    isHighlighted: boolean;
    onToggleFav: (item: InfoItem) => void;
    onToggleQueue: (item: InfoItem) => void;
    onEdit: (item: InfoItem) => void;
    onDeleteSuccess: () => void;
    onClick?: (item: InfoItem) => void;
}

export function InfoCard({
    item, theme, isStudy, displayImage, sourceName, sourceImg, isHighlighted, 
    onToggleFav, onToggleQueue, onEdit, onDeleteSuccess, onClick
}: InfoCardProps) {
    return (
        <motion.div
            key={item.id}
            id={`info-card-${item.id}`}
            layout="position"
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                layout: { type: "tween", ease: "easeOut", duration: 0.2 },
                opacity: { duration: 0.15 }
            }}
            onClick={() => onClick && onClick(item)}
            className={`flex flex-col rounded-2xl border ${theme.border} ${theme.cardBg} ${theme.cardHover} transition-all duration-500 overflow-hidden group relative shadow-sm hover:shadow-xl ${onClick ? 'cursor-pointer' : ''} ${isHighlighted ? theme.highlightRing + ' scale-[1.02] z-10' : ''}`}
        >
            <div className={`w-full h-32 relative shrink-0 ${isStudy ? 'bg-slate-800' : 'bg-stone-100'} overflow-hidden`}>
                {displayImage ? (
                    <img src={displayImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full opacity-20">
                        <Search size={40} className={theme.textMuted} />
                    </div>
                )}

                {item.is_favorited && (
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    </div>
                )}
                
                {/* 悬停时的快捷操作栏 */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFav(item); }}
                        title={item.is_favorited ? "取消收藏" : "标记收藏"}
                        className={`w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg hover:border-yellow-400/50 hover:bg-yellow-400/20 transition-all group/btn`}
                    >
                        <Star size={14} className={item.is_favorited ? "text-yellow-400 fill-yellow-400" : "text-white group-hover/btn:text-yellow-400"} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleQueue(item); }}
                        title={item.is_queued ? "移出待看" : "加入待看"}
                        className={`w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg hover:border-blue-400/50 hover:bg-blue-400/20 transition-all group/btn`}
                    >
                        <Bookmark size={14} className={item.is_queued ? "text-blue-400 fill-blue-400" : "text-white group-hover/btn:text-blue-400"} />
                    </button>
                </div>

                {/* 来源标识 (仅当存在具体来源时显示) */}
                {sourceName && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg backdrop-blur-md bg-black/50 text-white border border-white/10">
                        {sourceImg && <img src={sourceImg} alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />}
                        <span className="text-[10px] font-bold tracking-tight leading-none">{sourceName}</span>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1 relative">
                <div className="flex items-start justify-between gap-3 mb-2 pr-16 relative z-0">
                    <div>
                        <h3 className="font-bold text-base leading-snug line-clamp-2 md:line-clamp-1">{item.name}</h3>
                        {item.info_date && (
                            <div className={`flex items-center gap-1.5 text-xs mt-2 ${theme.textMuted} font-mono tracking-tight`}>
                                <Clock size={12} />
                                <span>{item.info_date}</span>
                            </div>
                        )}
                    </div>
                </div>

                {item.description && (
                    <p className={`text-sm ${theme.textMuted} line-clamp-2 mt-1 mb-4 leading-relaxed`}>
                        {item.description}
                    </p>
                )}
                
                <div className="mt-auto pt-4 flex items-center justify-between relative z-10 w-full">
                    {item.url && (
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1.5 text-xs font-bold ${theme.primary} hover:opacity-70 transition-opacity bg-black/5 px-3 py-1.5 rounded-full`}
                        >
                            <span>访问源链</span>
                            <ExternalLink size={12} />
                        </a>
                    )}
                    
                    {/* Inline actions (Edit and SafeDeleteDialog) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                            title="编辑修改"
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme.iconHoverBg} ${theme.textMuted} hover:${theme.primary}`}
                        >
                            <Edit size={14} />
                        </button>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                            <SafeDeleteDialog 
                                table="info_items"
                                recordId={item.id}
                                imageFields={['image_url']}
                                onSuccess={onDeleteSuccess}
                                title={`彻底删除 "${item.name}"？`}
                            >
                                <button
                                    title="永久删除"
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${theme.iconHoverBg} ${theme.textMuted} hover:text-red-500`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </SafeDeleteDialog>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
