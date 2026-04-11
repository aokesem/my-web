import React from 'react';

interface MindMapThumbnailProps {
  id: string;
  thumbnail?: string | null;
}

export const MindMapThumbnail = ({ id, thumbnail }: MindMapThumbnailProps) => {
  // If we have a real screenshot, display it
  if (thumbnail) {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-t-2xl bg-stone-100">
        <img
          src={thumbnail}
          alt="MindMap Preview"
          className="w-full h-full object-cover object-center"
        />
      </div>
    );
  }

  // Fallback: Generate a placeholder based on id
  const getSeed = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  const seed = getSeed(id);

  const gradients = [
    'from-blue-400 to-indigo-500',
    'from-emerald-400 to-teal-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-violet-400 to-purple-500',
    'from-sky-400 to-blue-500'
  ];

  const activeGradient = gradients[seed % gradients.length];

  return (
    <div className={`relative w-full h-full bg-linear-to-br ${activeGradient} overflow-hidden rounded-t-2xl`}>
      {/* Abstract MindMap Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 60">
        <defs>
          <filter id={`glow-${id}`}>
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Central Node */}
        <rect x="42" y="25" width="16" height="10" rx="2" fill="white" filter={`url(#glow-${id})`} />

        {/* Branches */}
        <path
          d={seed % 2 === 0
            ? "M58 30 L75 15 M58 30 L75 45 M42 30 L25 15 M42 30 L25 45"
            : "M58 30 Q70 20 80 20 M58 30 Q70 40 80 40 M42 30 Q30 20 20 20 M42 30 Q30 40 20 40"}
          stroke="white"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          filter={`url(#glow-${id})`}
        />

        {/* Leaf Nodes */}
        <circle cx={seed % 2 === 0 ? 75 : 80} cy={seed % 2 === 0 ? 15 : 20} r="3" fill="white" opacity="0.8" />
        <circle cx={seed % 2 === 0 ? 75 : 80} cy={seed % 2 === 0 ? 45 : 40} r="3" fill="white" opacity="0.8" />
        <circle cx={seed % 2 === 0 ? 25 : 20} cy={seed % 2 === 0 ? 15 : 20} r="3" fill="white" opacity="0.8" />
        <circle cx={seed % 2 === 0 ? 25 : 20} cy={seed % 2 === 0 ? 45 : 40} r="3" fill="white" opacity="0.8" />
      </svg>

      {/* Subtle Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
    </div>
  );
};
