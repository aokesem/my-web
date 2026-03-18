import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabaseClient';

// --- Types ---
type CategoryId = string;

interface Category {
  id: CategoryId;
  name: string;
  nameEn: string;
}

interface Thought {
  id: string;
  category_id: CategoryId;
  type: 'reflection' | 'vision';
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

// --- Constants ---
const CATEGORIES: Category[] = [
  { id: 'work', name: '工作与学习', nameEn: 'Work & Study' },
  { id: 'health', name: '身体与健康', nameEn: 'Body & Health' },
  { id: 'life', name: '生活与财富', nameEn: 'Life & Wealth' },
  { id: 'social', name: '社交与情感', nameEn: 'Heart & Bond' },
  { id: 'growth', name: '精神与自我', nameEn: 'Spirit & Self' },
];

// --- Greek Key SVG Pattern (for center divider) ---
const GreekKeyPattern = () => (
  <svg width="24" height="100%" className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 opacity-20 pointer-events-none" preserveAspectRatio="none">
    <defs>
      <pattern id="greekKey" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 0h24v6h-18v6h12v-6h6v18h-6v-12h-6v12h-6v-18h-6v-6z" fill="none" stroke="#c9a96e" strokeWidth="0.5" opacity="0.6" />
      </pattern>
    </defs>
    <rect width="24" height="100%" fill="url(#greekKey)" />
  </svg>
);

// --- Corner Ornament Component ---
const CornerOrnament = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const rotations: Record<string, string> = {
    'top-left': 'rotate(0)',
    'top-right': 'rotate(90deg)',
    'bottom-right': 'rotate(180deg)',
    'bottom-left': 'rotate(270deg)',
  };
  const positions: Record<string, string> = {
    'top-left': 'top-3 left-3',
    'top-right': 'top-3 right-3',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
  };
  return (
    <div className={`absolute ${positions[position]} w-12 h-12 pointer-events-none opacity-30`} style={{ transform: rotations[position] }}>
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 2 L2 20 Q2 8 14 6 L2 6 L2 2 Z" stroke="#c9a96e" strokeWidth="1" fill="#c9a96e" fillOpacity="0.1" />
        <path d="M2 2 L20 2 Q8 2 6 14 L6 2 Z" stroke="#c9a96e" strokeWidth="1" fill="#c9a96e" fillOpacity="0.1" />
        <circle cx="4" cy="4" r="1.5" fill="#c9a96e" fillOpacity="0.5" />
        <path d="M6 2 Q10 10 2 14" stroke="#c9a96e" strokeWidth="0.5" fill="none" opacity="0.6" />
        <path d="M2 6 Q10 8 14 2" stroke="#c9a96e" strokeWidth="0.5" fill="none" opacity="0.6" />
      </svg>
    </div>
  );
};

// --- Ivy Vine Border (left column → center) ---
const IvyBorder = () => (
  <div className="relative w-[28px] shrink-0 h-full overflow-hidden pointer-events-none z-10">
    <svg width="28" height="100%" className="absolute inset-0" preserveAspectRatio="none">
      <defs>
        <pattern id="ivyPattern" x="0" y="0" width="28" height="120" patternUnits="userSpaceOnUse">
          {/* Main vine stem */}
          <path d="M14 0 Q16 15 12 30 Q8 45 15 60 Q20 75 13 90 Q8 105 14 120" fill="none" stroke="#5a6e5a" strokeWidth="1.2" opacity="0.4" />
          {/* Ivy leaves - left side */}
          <path d="M12 12 Q6 8 4 14 Q6 18 12 15" fill="#4a5e4a" fillOpacity="0.25" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.5" />
          <path d="M10 42 Q4 38 2 44 Q4 48 10 45" fill="#4a5e4a" fillOpacity="0.25" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.4" />
          <path d="M11 72 Q5 68 3 74 Q5 78 11 75" fill="#4a5e4a" fillOpacity="0.25" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.5" />
          <path d="M9 102 Q3 98 1 104 Q3 108 9 105" fill="#4a5e4a" fillOpacity="0.25" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.4" />
          {/* Ivy leaves - right side */}
          <path d="M15 27 Q21 23 23 29 Q21 33 15 30" fill="#4a5e4a" fillOpacity="0.2" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.45" />
          <path d="M16 57 Q22 53 24 59 Q22 63 16 60" fill="#4a5e4a" fillOpacity="0.2" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.4" />
          <path d="M14 87 Q20 83 22 89 Q20 93 14 90" fill="#4a5e4a" fillOpacity="0.2" stroke="#5a6e5a" strokeWidth="0.5" opacity="0.45" />
          {/* Small tendrils */}
          <path d="M12 20 Q8 18 6 20" fill="none" stroke="#5a6e5a" strokeWidth="0.4" opacity="0.3" />
          <path d="M15 50 Q19 48 21 50" fill="none" stroke="#5a6e5a" strokeWidth="0.4" opacity="0.3" />
          <path d="M13 80 Q9 78 7 80" fill="none" stroke="#5a6e5a" strokeWidth="0.4" opacity="0.3" />
          <path d="M15 110 Q19 108 21 110" fill="none" stroke="#5a6e5a" strokeWidth="0.4" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="28" height="100%" fill="url(#ivyPattern)" />
    </svg>
    {/* Gradient fade at top and bottom */}
    <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-[#354050] to-transparent z-10" />
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#3d4a5a] to-transparent z-10" />
  </div>
);

// --- Olive Branch Border (center → right column) ---
const OliveBranchBorder = () => (
  <div className="relative w-[28px] shrink-0 h-full overflow-hidden pointer-events-none z-10">
    <svg width="28" height="100%" className="absolute inset-0" preserveAspectRatio="none">
      <defs>
        <pattern id="olivePattern" x="0" y="0" width="28" height="120" patternUnits="userSpaceOnUse">
          {/* Main branch stem */}
          <path d="M14 0 Q11 15 16 30 Q20 45 13 60 Q8 75 15 90 Q19 105 14 120" fill="none" stroke="#b8976a" strokeWidth="1" opacity="0.35" />
          {/* Olive leaves - left side (elongated, elegant) */}
          <path d="M13 10 Q7 6 5 12 Q7 14 13 12" fill="#c9a96e" fillOpacity="0.15" stroke="#b8976a" strokeWidth="0.5" opacity="0.4" />
          <path d="M11 40 Q5 36 3 42 Q5 44 11 42" fill="#c9a96e" fillOpacity="0.12" stroke="#b8976a" strokeWidth="0.5" opacity="0.35" />
          <path d="M12 70 Q6 66 4 72 Q6 74 12 72" fill="#c9a96e" fillOpacity="0.15" stroke="#b8976a" strokeWidth="0.5" opacity="0.4" />
          <path d="M10 100 Q4 96 2 102 Q4 104 10 102" fill="#c9a96e" fillOpacity="0.12" stroke="#b8976a" strokeWidth="0.5" opacity="0.35" />
          {/* Olive leaves - right side */}
          <path d="M17 25 Q23 21 25 27 Q23 29 17 27" fill="#c9a96e" fillOpacity="0.12" stroke="#b8976a" strokeWidth="0.5" opacity="0.35" />
          <path d="M18 55 Q24 51 26 57 Q24 59 18 57" fill="#c9a96e" fillOpacity="0.15" stroke="#b8976a" strokeWidth="0.5" opacity="0.4" />
          <path d="M16 85 Q22 81 24 87 Q22 89 16 87" fill="#c9a96e" fillOpacity="0.12" stroke="#b8976a" strokeWidth="0.5" opacity="0.35" />
          <path d="M17 115 Q23 111 25 117 Q23 119 17 117" fill="#c9a96e" fillOpacity="0.15" stroke="#b8976a" strokeWidth="0.5" opacity="0.4" />
          {/* Small olives (berries) */}
          <circle cx="10" cy="24" r="1.5" fill="#8a7a5a" fillOpacity="0.25" />
          <circle cx="20" cy="54" r="1.5" fill="#8a7a5a" fillOpacity="0.2" />
          <circle cx="9" cy="84" r="1.5" fill="#8a7a5a" fillOpacity="0.25" />
          <circle cx="19" cy="114" r="1.5" fill="#8a7a5a" fillOpacity="0.2" />
        </pattern>
      </defs>
      <rect width="28" height="100%" fill="url(#olivePattern)" />
    </svg>
    {/* Gradient fade at top and bottom */}
    <div className="absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-[#2c2c38] to-transparent z-10" />
    <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-[#2c2c38] to-transparent z-10" />
  </div>
);

// --- Props ---
interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReflectionModal({ isOpen, onClose }: ReflectionModalProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchThoughts();
    }
  }, [isOpen]);

  const fetchThoughts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setThoughts(data);
    }
    setIsLoading(false);
  };

  const handleCreate = async (type: 'reflection' | 'vision') => {
    if (!activeCategory) return;
    
    const optimisticId = `temp-${Date.now()}`;
    const newThought: Thought = {
      id: optimisticId,
      category_id: activeCategory,
      type,
      title: '新建笔记...',
      content: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setThoughts(prev => [newThought, ...prev]);
    setExpandedThoughtId(optimisticId);
    
    const { data, error } = await supabase
      .from('thoughts')
      .insert([{ category_id: activeCategory, type, title: '新建笔记...', content: '' }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating:', error);
      setThoughts(prev => prev.filter(t => t.id !== optimisticId));
    } else if (data) {
      setThoughts(prev => prev.map(t => t.id === optimisticId ? data : t));
      if (expandedThoughtId === optimisticId) {
        setExpandedThoughtId(data.id);
      }
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Thought>) => {
    setThoughts(prev => prev.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
    if (id.startsWith('temp-')) return;
    const { error } = await supabase.from('thoughts').update(updates).eq('id', id);
    if (error) console.error('Error updating:', error);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除吗？')) return;
    setThoughts(prev => prev.filter(t => t.id !== id));
    if (expandedThoughtId === id) setExpandedThoughtId(null);
    if (!id.startsWith('temp-')) {
      await supabase.from('thoughts').delete().eq('id', id);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* eslint-disable-next-line @next/next/no-page-custom-font */}
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700&display=swap" rel="stylesheet" />

          {/* Main Panel */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="relative w-full max-w-[1300px] h-full max-h-[82vh] rounded-xl overflow-hidden shadow-2xl border border-[#c9a96e]/20"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {/* Corner Ornaments */}
            <CornerOrnament position="top-left" />
            <CornerOrnament position="top-right" />
            <CornerOrnament position="bottom-left" />
            <CornerOrnament position="bottom-right" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2c38] border border-[#c9a96e]/40 text-[#c9a96e] shadow-lg shadow-black/20 hover:scale-110 hover:bg-[#1a1a24] hover:border-[#c9a96e] transition-all duration-300 group"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Three-Column Layout */}
            <div className="flex h-full">

              {/* ========== LEFT COLUMN: Reflection / Dark Temple ========== */}
              <div className="flex-1 h-full overflow-y-auto relative"
                style={{
                  background: 'linear-gradient(180deg, #3a4554 0%, #354050 40%, #3d4a5a 100%)',
                }}
              >
                {/* Subtle stone texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }} />

                {/* Column Header */}
                <div className="relative p-6 pb-4 border-b border-slate-400/15">
                  <h3 className="text-base tracking-[0.25em] text-slate-300/70 uppercase text-center" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    Reflections
                  </h3>
                  <p className="text-[11px] text-slate-500 text-center mt-1 tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                    苦恼与羁绊
                  </p>
                  {/* Decorative underline */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-12 h-px bg-linear-to-r from-transparent to-slate-400/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400/40" />
                    <div className="w-12 h-px bg-linear-to-l from-transparent to-slate-400/30" />
                  </div>
                </div>

                {/* Reflection Cards for Active Category */}
                <div className="p-5 space-y-4">
                  <AnimatePresence mode="wait">
                    {activeCategory ? (
                      <motion.div
                        key={activeCategory + '-reflection'}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        {thoughts.filter(t => t.category_id === activeCategory && t.type === 'reflection').map((thought) => (
                          <ReflectionCard
                            key={thought.id}
                            thought={thought}
                            isExpanded={expandedThoughtId === thought.id}
                            onToggle={() => setExpandedThoughtId(prev => prev === thought.id ? null : thought.id)}
                            onUpdate={handleUpdate}
                            onDelete={() => handleDelete(thought.id)}
                          />
                        ))}
                        {/* Add Button */}
                        <button onClick={() => handleCreate('reflection')} className="w-full py-3 border border-dashed border-slate-400/15 rounded-lg text-slate-400/40 hover:text-slate-300/70 hover:border-slate-400/30 hover:bg-slate-400/5 transition-all flex items-center justify-center gap-2 text-sm tracking-wider">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span style={{ fontFamily: "'Cinzel', serif" }}>New Entry</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="reflection-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-40 text-slate-600 text-sm tracking-wider"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>选择一个分类以展开</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Ivy Vine Border: Left → Center */}
              <IvyBorder />

              {/* ========== CENTER COLUMN: Category Axis / Stone Pillar ========== */}
              <div className="relative w-[200px] shrink-0 h-full overflow-y-auto flex flex-col items-center"
                style={{
                  background: 'linear-gradient(180deg, #2c2c38 0%, #232330 50%, #2c2c38 100%)',
                }}
              >
                {/* Greek Key Pattern Background */}
                <GreekKeyPattern />

                {/* Top border ornament */}
                <div className="w-full flex items-center justify-center py-4 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-px bg-[#c9a96e]/30" />
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#c9a96e]/40" fill="currentColor">
                      <path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                    </svg>
                    <div className="w-8 h-px bg-[#c9a96e]/30" />
                  </div>
                </div>

                {/* Category Buttons */}
                <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4 relative z-10 py-4">
                  {CATEGORIES.map((category) => {
                    const isActive = activeCategory === category.id;
                    const reflectionCount = thoughts.filter(t => t.category_id === category.id && t.type === 'reflection').length;
                    const visionCount = thoughts.filter(t => t.category_id === category.id && t.type === 'vision').length;

                    return (
                      <motion.button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(isActive ? null : category.id);
                          setExpandedThoughtId(null);
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className={`
                          relative w-full px-4 py-3 rounded-md border text-center transition-all duration-300 group/cat
                          ${isActive
                            ? 'bg-[#c9a96e]/15 border-[#c9a96e]/40 shadow-lg shadow-[#c9a96e]/10'
                            : 'bg-white/2 border-white/6 hover:bg-white/5 hover:border-[#c9a96e]/20'
                          }
                        `}
                      >
                        {/* Badge ornament top */}
                        <div className={`absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px transition-colors ${isActive ? 'bg-[#c9a96e]/60' : 'bg-[#c9a96e]/15'}`} />

                        <span className={`block text-xs tracking-[0.2em] uppercase transition-colors ${isActive ? 'text-[#c9a96e]' : 'text-slate-400 group-hover/cat:text-slate-300'}`}>
                          {category.name}
                        </span>
                        <span className={`block text-[9px] tracking-[0.15em] mt-0.5 transition-colors ${isActive ? 'text-[#c9a96e]/50' : 'text-slate-600'}`}>
                          {category.nameEn}
                        </span>

                        {/* Count indicators */}
                        {(reflectionCount > 0 || visionCount > 0) && (
                          <div className="flex items-center justify-center gap-3 mt-2">
                            {reflectionCount > 0 && (
                              <span className="text-[9px] text-purple-400/50 tracking-wider">{reflectionCount} ◂</span>
                            )}
                            {visionCount > 0 && (
                              <span className="text-[9px] text-amber-400/50 tracking-wider">▸ {visionCount}</span>
                            )}
                          </div>
                        )}

                        {/* Badge ornament bottom */}
                        <div className={`absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-px transition-colors ${isActive ? 'bg-[#c9a96e]/60' : 'bg-[#c9a96e]/15'}`} />
                      </motion.button>
                    );
                  })}
                </div>

                {/* Bottom ornament */}
                <div className="w-full flex items-center justify-center py-4 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-px bg-[#c9a96e]/30" />
                    <svg viewBox="0 0 16 16" className="w-4 h-4 text-[#c9a96e]/40" fill="currentColor">
                      <path d="M8 0l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                    </svg>
                    <div className="w-8 h-px bg-[#c9a96e]/30" />
                  </div>
                </div>
              </div>

              {/* Olive Branch Border: Center → Right */}
              <OliveBranchBorder />

              {/* ========== RIGHT COLUMN: Vision / Sacred Light Temple ========== */}
              <div className="flex-1 h-full overflow-y-auto relative"
                style={{
                  background: 'linear-gradient(180deg, #f0e6d3 0%, #ebe0ce 40%, #e8dcc8 100%)',
                }}
              >
                {/* Parchment texture overlay */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }} />
                {/* Warm light glow */}
                <div className="absolute top-0 right-0 w-3/4 h-1/2 bg-[radial-gradient(ellipse_at_top_right,rgba(201,169,110,0.08),transparent_70%)] pointer-events-none" />

                {/* Column Header */}
                <div className="relative p-6 pb-4 border-b border-amber-700/10">
                  <h3 className="text-base tracking-[0.25em] text-amber-800/60 uppercase text-center" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
                    Visions
                  </h3>
                  <p className="text-[11px] text-amber-700/40 text-center mt-1 tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                    远见与思考
                  </p>
                  {/* Decorative underline */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-12 h-px bg-linear-to-r from-transparent to-amber-700/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600/30" />
                    <div className="w-12 h-px bg-linear-to-l from-transparent to-amber-700/20" />
                  </div>
                </div>

                {/* Vision Cards for Active Category */}
                <div className="p-5 space-y-4">
                  <AnimatePresence mode="wait">
                    {activeCategory ? (
                      <motion.div
                        key={activeCategory + '-vision'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        {thoughts.filter(t => t.category_id === activeCategory && t.type === 'vision').map((thought) => (
                          <VisionCard
                            key={thought.id}
                            thought={thought}
                            isExpanded={expandedThoughtId === thought.id}
                            onToggle={() => setExpandedThoughtId(prev => prev === thought.id ? null : thought.id)}
                            onUpdate={handleUpdate}
                            onDelete={() => handleDelete(thought.id)}
                          />
                        ))}
                        {/* Add Button */}
                        <button onClick={() => handleCreate('vision')} className="w-full py-3 border border-dashed border-amber-700/15 rounded-lg text-amber-700/30 hover:text-amber-700/60 hover:border-amber-700/30 hover:bg-amber-700/5 transition-all flex items-center justify-center gap-2 text-sm tracking-wider">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span style={{ fontFamily: "'Cinzel', serif" }}>New Entry</span>
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="vision-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-40 text-amber-700/30 text-sm tracking-wider"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        <span>选择一个分类以展开</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


// ============================================================
// CARD COMPONENTS
// ============================================================

// --- Reflection Card (Dark Side) ---
function ReflectionCard({ thought, isExpanded, onToggle, onUpdate, onDelete }: { 
  thought: Thought; 
  isExpanded: boolean; 
  onToggle: () => void;
  onUpdate: (id: string, updates: Partial<Thought>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(thought.title);
  const [content, setContent] = useState(thought.content || '');

  useEffect(() => {
    setTitle(thought.title);
    setContent(thought.content || '');
  }, [thought.title, thought.content]);

  const handleSaveTitle = () => {
    if (title !== thought.title) onUpdate(thought.id, { title });
  };

  const handleSaveContent = () => {
    if (content !== (thought.content || '')) onUpdate(thought.id, { content });
  };

  return (
    <motion.div
      layout
      onClick={!isExpanded ? onToggle : undefined}
      className={`
        relative rounded-lg border p-4 transition-all duration-300 group/card
        bg-[#2e3a48]/60 border-slate-400/10 hover:border-slate-400/25 backdrop-blur-sm
        ${isExpanded ? 'ring-1 ring-slate-400/15 shadow-lg shadow-slate-900/20' : 'cursor-pointer hover:bg-[#2e3a48]/80'}
      `}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-slate-400/15 to-transparent" />

      <div className="flex justify-between items-start">
        {isExpanded ? (
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onClick={e => e.stopPropagation()}
            className="text-sm text-slate-200 tracking-wider leading-relaxed flex-1 pr-3 bg-transparent border-none outline-none font-sans"
            placeholder="标题..."
          />
        ) : (
          <h4 className="text-sm text-slate-200/80 tracking-wider leading-relaxed flex-1 pr-3" style={{ fontFamily: "system-ui, sans-serif" }}>
            {thought.title}
          </h4>
        )}

        <div className={`flex gap-1.5 shrink-0 transition-opacity ${isExpanded ? 'opacity-80' : 'opacity-0 group-hover/card:opacity-50'}`}>
          <button className="p-1 rounded hover:bg-slate-400/10 text-slate-400/50 hover:text-slate-200 transition-all" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button className="p-1 rounded hover:bg-red-500/10 text-slate-400/50 hover:text-red-300 transition-all" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      <div className="text-[10px] text-slate-600 mt-1.5 tracking-widest">{new Date(thought.created_at).toLocaleDateString()}</div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-slate-400/10">
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={handleSaveContent}
                onClick={e => e.stopPropagation()}
                placeholder="点击添加笔记..."
                className="w-full min-h-[80px] text-sm leading-relaxed text-slate-300/70 bg-transparent border-none outline-none resize-none font-sans"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Vision Card (Light Side) ---
function VisionCard({ thought, isExpanded, onToggle, onUpdate, onDelete }: { 
  thought: Thought; 
  isExpanded: boolean; 
  onToggle: () => void;
  onUpdate: (id: string, updates: Partial<Thought>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(thought.title);
  const [content, setContent] = useState(thought.content || '');

  useEffect(() => {
    setTitle(thought.title);
    setContent(thought.content || '');
  }, [thought.title, thought.content]);

  const handleSaveTitle = () => {
    if (title !== thought.title) onUpdate(thought.id, { title });
  };

  const handleSaveContent = () => {
    if (content !== (thought.content || '')) onUpdate(thought.id, { content });
  };

  return (
    <motion.div
      layout
      onClick={!isExpanded ? onToggle : undefined}
      className={`
        relative rounded-lg border p-4 transition-all duration-300 group/card
        bg-white/50 border-amber-700/10 hover:border-amber-600/25 backdrop-blur-sm
        ${isExpanded ? 'ring-1 ring-amber-600/15 shadow-lg shadow-amber-900/10' : 'cursor-pointer hover:bg-white/70'}
      `}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-amber-600/15 to-transparent" />

      <div className="flex justify-between items-start">
        {isExpanded ? (
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onClick={e => e.stopPropagation()}
            className="text-sm text-amber-900 tracking-wider leading-relaxed flex-1 pr-3 bg-transparent border-none outline-none font-sans"
            placeholder="标题..."
          />
        ) : (
          <h4 className="text-sm text-amber-900/70 tracking-wider leading-relaxed flex-1 pr-3" style={{ fontFamily: "system-ui, sans-serif" }}>
            {thought.title}
          </h4>
        )}

        <div className={`flex gap-1.5 shrink-0 transition-opacity ${isExpanded ? 'opacity-80' : 'opacity-0 group-hover/card:opacity-50'}`}>
          <button className="p-1 rounded hover:bg-amber-500/10 text-amber-700/40 hover:text-amber-800 transition-all" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </button>
          <button className="p-1 rounded hover:bg-red-500/10 text-amber-700/40 hover:text-red-600 transition-all" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
      <div className="text-[10px] text-amber-800/30 mt-1.5 tracking-widest">{new Date(thought.created_at).toLocaleDateString()}</div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-amber-600/10">
              <textarea 
                value={content}
                onChange={e => setContent(e.target.value)}
                onBlur={handleSaveContent}
                onClick={e => e.stopPropagation()}
                placeholder="点击添加笔记..."
                className="w-full min-h-[80px] text-sm leading-relaxed text-amber-900/50 bg-transparent border-none outline-none resize-none font-sans"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
