"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CalendarWidgetProps {
    isActive: boolean;
    onToggle: () => void;
}

// 获取当天是本月第几天，用于高亮
function getTodayGrid() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    // 本月第一天是星期几 (0=Sun)
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    // 本月总天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { day, firstDayOfWeek, daysInMonth };
}

function getMonthAbbr() {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[new Date().getMonth()];
}

export default function CalendarWidget({ isActive, onToggle }: CalendarWidgetProps) {
    const { day, firstDayOfWeek, daysInMonth } = getTodayGrid();
    const monthAbbr = getMonthAbbr();
    const todayDate = new Date().getDate();

    // 生成日历网格数据：简化为 5 行 7 列
    const gridCells: Array<{ day: number | null; isToday: boolean }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        gridCells.push({ day: null, isToday: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        gridCells.push({ day: d, isToday: d === day });
    }
    // 补齐到 35 格 (5行)
    while (gridCells.length < 35) {
        gridCells.push({ day: null, isToday: false });
    }

    // 暂时硬编码状态：未标记
    // 状态: 'none' | 'good' | 'ok' | 'bad'
    const todayStatus: 'none' | 'good' | 'ok' | 'bad' = 'none';

    const statusColorMap = {
        none: 'bg-slate-300',
        good: 'bg-emerald-400',
        ok: 'bg-amber-400',
        bad: 'bg-rose-400',
    };

    const statusGlowMap = {
        none: 'shadow-[0_0_8px_rgba(148,163,184,0.6)]',
        good: 'shadow-[0_0_10px_rgba(52,211,153,0.8)]',
        ok: 'shadow-[0_0_10px_rgba(251,191,36,0.8)]',
        bad: 'shadow-[0_0_10px_rgba(251,113,133,0.8)]',
    };

    const statusGlowHoverMap = {
        none: 'shadow-[0_0_14px_rgba(148,163,184,0.9)]',
        good: 'shadow-[0_0_16px_rgba(52,211,153,1)]',
        ok: 'shadow-[0_0_16px_rgba(251,191,36,1)]',
        bad: 'shadow-[0_0_16px_rgba(251,113,133,1)]',
    };

    const [isHovered, setIsHovered] = useState(false);

    if (isActive) return null; // 展开态暂不实现

    return (
        <motion.div
            onClick={onToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="cursor-pointer select-none flex items-stretch"
            style={{ height: 52 }}
        >
            {/* 左侧：微型日历图案（无外框） */}
            <div
                className={`flex flex-col backdrop-blur-sm rounded-l-lg overflow-hidden transition-colors duration-400 ${isHovered ? 'bg-blue-50/90' : 'bg-slate-100/80'
                    }`}
                style={{ width: 52, height: 52 }}
            >
                {/* 日历头条 */}
                <div className={`h-[10px] flex items-center justify-center shrink-0 transition-colors duration-400 ${isHovered ? 'bg-blue-400/60' : 'bg-blue-400/40'
                    }`}>
                    <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                        <div className="w-[3px] h-[3px] rounded-full bg-white/80" />
                    </div>
                </div>
                {/* 日历网格 */}
                <div className="flex-1 p-[3px] grid grid-cols-7 gap-[1.5px] place-items-center">
                    {gridCells.slice(0, 35).map((cell, i) => (
                        <div
                            key={i}
                            className={`
                                rounded-[1px]
                                ${cell.day
                                    ? cell.isToday
                                        ? 'bg-blue-500 w-[4px] h-[4px]'
                                        : 'bg-slate-300/80 w-[3px] h-[3px]'
                                    : 'w-[3px] h-[3px]'
                                }
                            `}
                        />
                    ))}
                </div>
            </div>

            {/* 右侧：日期 + 指示灯（有边框） */}
            <div
                className={`flex items-center gap-2 backdrop-blur-sm border border-l-0 rounded-r-lg px-3 transition-all duration-400 ${isHovered
                    ? 'bg-white/90 border-blue-400/70'
                    : 'bg-white/60 border-slate-300/60'
                    }`}
                style={{ height: 52 }}
            >
                {/* 日期部分 */}
                <div className="flex flex-col items-center justify-center leading-none">
                    <span className={`text-[12px] font-mono font-bold tracking-[0.15em] uppercase transition-colors duration-400 ${isHovered ? 'text-blue-500' : 'text-slate-400'
                        }`}>
                        {monthAbbr}
                    </span>
                    <span className={`text-[22px] font-black tracking-tight leading-none mt-px transition-colors duration-400 ${isHovered ? 'text-slate-800' : 'text-slate-600'
                        }`}>
                        {todayDate}
                    </span>
                </div>

                {/* 分隔线 */}
                <div className="w-px h-[26px] bg-slate-200/80" />

                {/* 指示灯：圆形 + CSS 发光呼吸 */}
                <div
                    className={`rounded-full ${statusColorMap[todayStatus]} ${isHovered ? statusGlowHoverMap[todayStatus] : statusGlowMap[todayStatus]
                        } ${!isHovered ? 'animate-pulse' : ''} transition-all duration-400`}
                    style={{ width: 22, height: 22 }}
                    title={`Today's status: ${todayStatus}`}
                />
            </div>
        </motion.div>
    );
}
