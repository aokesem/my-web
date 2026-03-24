"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Database, HardDrive, Zap, Info, RefreshCw, ArrowUpRight } from 'lucide-react';
import { getUsageStats } from './actions/usage';
import { toast } from 'sonner';

interface UsageData {
    dbSize: number;
    storageSize: number;
    egress: number;
    cachedEgress: number;
}

const LIMITS = {
    DB: 500,        // 500MB
    STORAGE: 5120,  // 5GB
    EGRESS: 5120    // 5GB
};

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UsageData | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        const result = await getUsageStats();
        if (result.success && result.data) {
            setStats(result.data as UsageData);
        } else {
            toast.error('获取 Usage 数据失败: ' + (result.error || '未知错误'));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const formatSize = (mb: number) => {
        if (mb < 1) return (mb * 1024).toFixed(1) + ' KB';
        if (mb >= 1024) return (mb / 1024).toFixed(2) + ' GB';
        return mb.toFixed(2) + ' MB';
    };

    const getPercentage = (value: number, limit: number) => {
        return Math.min(Math.round((value / limit) * 100), 100);
    };

    const MetricCard = ({ title, value, limit, icon: Icon, unit = 'MB', description }: any) => {
        const percent = getPercentage(value, limit);
        const isWarning = percent > 80;

        return (
            <Card className="bg-zinc-950 border-zinc-900 overflow-hidden relative group">
                <div className={`absolute top-0 left-0 w-1 h-full ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                        {title}
                    </CardTitle>
                    <Icon size={18} className={isWarning ? 'text-amber-500' : 'text-blue-500'} />
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold tracking-tight text-white">
                            {formatSize(value)}
                        </div>
                        <div className="text-xs text-zinc-600 font-mono">
                            / {formatSize(limit)}
                        </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${isWarning ? 'bg-amber-500' : 'bg-blue-600'}`}
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-500">
                            <span>Usage: {percent}%</span>
                            <span className={isWarning ? 'text-amber-500' : ''}>
                                {isWarning ? 'Quota Alert' : 'Healthy'}
                            </span>
                        </div>
                    </div>
                    {description && (
                        <CardDescription className="mt-4 text-[11px] text-zinc-500 italic">
                            {description}
                        </CardDescription>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 lg:p-0">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        Usage 控制台
                        {loading && <RefreshCw size={20} className="animate-spin text-zinc-500" />}
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        实时监控 Supabase 基础设施占用情况及带宽消耗。
                    </p>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={fetchStats}
                        disabled={loading}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-300 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        手动刷新
                    </button>
                    <a 
                        href="https://supabase.com/dashboard/project/"
                        target="_blank"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-2"
                    >
                        官方 Dashboard <ArrowUpRight size={14} />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Database Size" 
                    value={stats?.dbSize || 0} 
                    limit={LIMITS.DB} 
                    icon={Database}
                    description="数据库行记录及索引占用的物理磁盘空间。"
                />
                <MetricCard 
                    title="Storage Size" 
                    value={stats?.storageSize || 0} 
                    limit={LIMITS.STORAGE} 
                    icon={HardDrive}
                    description="存储桶中所有图片、剧照等二进制文件的总量。"
                />
                <MetricCard 
                    title="Network Egress" 
                    value={stats?.egress || 0} 
                    limit={LIMITS.EGRESS} 
                    icon={Zap}
                    description="从服务器传出的总流量（API 调用及文件下载）。"
                />
                
                <Card className="bg-zinc-950 border-zinc-900 relative">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                            Cached Egress
                        </CardTitle>
                        <Info size={18} className="text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight text-white">
                            {formatSize(stats?.cachedEgress || 0)}
                        </div>
                        <CardDescription className="mt-4 text-[11px] text-zinc-500 leading-relaxed">
                            被 CDN 缓存直接返回的流量。
                            <br />
                            这部分流量**不占用**月度 5GB 的免费配额。
                        </CardDescription>
                        
                        <div className="mt-6 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-1">
                                Optimization Rate
                            </div>
                            <div className="text-lg font-mono text-emerald-400">
                                {stats && stats.egress > 0 
                                    ? ((stats.cachedEgress / (stats.egress + stats.cachedEgress)) * 100).toFixed(1)
                                    : '0.0'
                                }%
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 底部贴示 */}
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-2xl flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Info size={20} />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">关于免费配额说明</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-3xl">
                        当前项目处于 Supabase Free Tier。如果在结算周期内 Egress（非缓存流量）或存储超过 5GB，项目可能面临受限。
                        请关注进度条状态。如果发现 Database Size 增长异常，请检查是否存在大量冗余索引或大字段。
                    </p>
                </div>
            </div>
        </div>
    );
}
