"use client";

import React from "react";
import { Clock, AlertCircle, Info, Loader2, Check, BookOpen, Activity, Palette } from "lucide-react";
import type { HubReminder, HubRhythmCategory } from "../types";
import { DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS } from "../useInfoHubData";

function reminderStyles(tone: HubReminder["tone"]) {
    if (tone === "warn") {
        return "text-amber-900/90 bg-amber-50/90 border-amber-200/70";
    }
    return "text-slate-700 bg-slate-50/90 border-slate-200/70";
}

function deadlineReminderStyles(tone: HubReminder["tone"]) {
    if (tone === "warn") {
        return "border-rose-300/80 bg-gradient-to-r from-rose-50/95 via-white/90 to-rose-50/40 shadow-[inset_3px_0_0_0_rgba(244,63,94,0.55)]";
    }
    return "border-violet-200/70 bg-gradient-to-r from-violet-50/80 via-white/90 to-violet-50/30 shadow-[inset_3px_0_0_0_rgba(139,92,246,0.45)]";
}

function rhythmReminderTheme(category?: HubRhythmCategory) {
    switch (category) {
        case "study":
            return {
                Icon: BookOpen,
                row: "border-blue-200/80 bg-blue-50/90 text-blue-950 shadow-[inset_3px_0_0_0_rgba(59,130,246,0.45)]",
                icon: "border-blue-200/80 bg-blue-100/80 text-blue-600",
                input: "border-blue-200/70 bg-white/75 text-blue-950 placeholder:text-blue-700/35 focus:border-blue-300 focus:bg-white",
                button: "border-blue-200/70 text-blue-700/85 hover:bg-blue-100/60 hover:text-blue-800",
            };
        case "exercise":
            return {
                Icon: Activity,
                row: "border-rose-200/80 bg-rose-50/90 text-rose-950 shadow-[inset_3px_0_0_0_rgba(244,63,94,0.45)]",
                icon: "border-rose-200/80 bg-rose-100/80 text-rose-600",
                input: "border-rose-200/70 bg-white/75 text-rose-950 placeholder:text-rose-700/35 focus:border-rose-300 focus:bg-white",
                button: "border-rose-200/70 text-rose-700/85 hover:bg-rose-100/60 hover:text-rose-800",
            };
        case "arts":
            return {
                Icon: Palette,
                row: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 shadow-[inset_3px_0_0_0_rgba(16,185,129,0.45)]",
                icon: "border-emerald-200/80 bg-emerald-100/80 text-emerald-600",
                input: "border-emerald-200/70 bg-white/75 text-emerald-950 placeholder:text-emerald-700/35 focus:border-emerald-300 focus:bg-white",
                button: "border-emerald-200/70 text-emerald-700/85 hover:bg-emerald-100/60 hover:text-emerald-800",
            };
        default:
            return null;
    }
}

export function ReminderRow({
    reminder,
    onOpenCalendar,
    onOpenProtocol,
    onClose,
    onIgnoreFriendReminder,
    friendSnoozeDays,
    onFriendSnoozeDaysChange,
    onUpdateFriendLastContact,
    friendLastContactDate,
    onFriendLastContactDateChange,
    isUpdatingLastContact,
    onUpdateRhythmReminder,
    rhythmEventName,
    onRhythmEventNameChange,
    rhythmEventDate,
    onRhythmEventDateChange,
    isUpdatingRhythm,
}: {
    reminder: HubReminder;
    onOpenCalendar?: () => void;
    onOpenProtocol?: () => void;
    onClose: () => void;
    onIgnoreFriendReminder?: (friendId: number) => void;
    friendSnoozeDays?: string;
    onFriendSnoozeDaysChange?: (value: string) => void;
    onUpdateFriendLastContact?: (friendId: number) => void;
    friendLastContactDate?: string;
    onFriendLastContactDateChange?: (value: string) => void;
    isUpdatingLastContact?: boolean;
    onUpdateRhythmReminder?: (category: HubRhythmCategory) => void;
    rhythmEventName?: string;
    onRhythmEventNameChange?: (value: string) => void;
    rhythmEventDate?: string;
    onRhythmEventDateChange?: (value: string) => void;
    isUpdatingRhythm?: boolean;
}) {
    const handleCalendar = () => {
        onClose();
        onOpenCalendar?.();
    };

    const handleProtocol = () => {
        onClose();
        onOpenProtocol?.();
    };

    if (reminder.kind === "deadline" && reminder.deadlineTitle) {
        const dateLabel = reminder.deadlineDate?.replace(/-/g, ".") ?? "";
        const isUrgent = reminder.tone === "warn";

        return (
            <li
                className={`flex items-stretch gap-3 rounded-lg border px-3 py-3 text-sm ${deadlineReminderStyles(reminder.tone)}`}
            >
                <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${isUrgent
                        ? "border-rose-200/80 bg-rose-100/80 text-rose-600"
                        : "border-violet-200/70 bg-violet-100/70 text-violet-600"
                        }`}
                    aria-hidden
                >
                    <Clock size={15} strokeWidth={2.25} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 leading-snug truncate">
                        {reminder.deadlineTitle}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                            className={`text-[11px] font-mono font-bold tracking-wide px-2 py-0.5 rounded-md border ${isUrgent
                                ? "text-rose-700 bg-rose-100/60 border-rose-200/60"
                                : "text-violet-700 bg-violet-100/50 border-violet-200/50"
                                }`}
                        >
                            {reminder.deadlineWhen}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 tracking-tight">
                            {dateLabel}
                        </span>
                    </div>
                </div>
                {onOpenCalendar && (
                    <button
                        type="button"
                        onClick={handleCalendar}
                        className={`self-center text-[11px] font-mono shrink-0 px-2 py-1 rounded-md border transition-colors ${isUrgent
                            ? "text-rose-600/80 border-rose-200/50 hover:bg-rose-100/60 hover:text-rose-700"
                            : "text-violet-600/80 border-violet-200/50 hover:bg-violet-100/50 hover:text-violet-700"
                            }`}
                    >
                        日历
                    </button>
                )}
            </li>
        );
    }

    const rhythmTheme = reminder.kind === "rhythm" ? rhythmReminderTheme(reminder.rhythmCategory) : null;
    const Icon = rhythmTheme?.Icon ?? (reminder.tone === "warn" ? AlertCircle : Info);

    return (
        <li
            className={`flex items-start gap-2 text-sm border rounded-lg px-3 py-2.5 ${rhythmTheme?.row ?? reminderStyles(reminder.tone)}`}
        >
            {rhythmTheme ? (
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${rhythmTheme.icon}`}>
                    <Icon size={15} strokeWidth={2.25} />
                </div>
            ) : (
                <Icon size={16} className="shrink-0 mt-0.5 opacity-80" />
            )}
            <span className="flex-1 leading-snug">
                {reminder.message}
                {reminder.kind === "friend_contact" && reminder.friendScheduledDate && (
                    <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                        预定 {reminder.friendScheduledDate.replace(/-/g, '.')}
                    </span>
                )}
            </span>
            {reminder.kind === "friend_contact" && reminder.friendId && onIgnoreFriendReminder && (
                <div className="flex shrink-0 items-center gap-2">
                    {/* 更新最后联系日期 */}
                    {onUpdateFriendLastContact && (
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-slate-400">联系日</span>
                            <input
                                type="date"
                                aria-label="更新最后联系日期"
                                value={friendLastContactDate ?? ''}
                                onChange={(event) => onFriendLastContactDateChange?.(event.target.value)}
                                className="h-7 w-[120px] rounded-md border border-slate-200/70 bg-white/70 px-2 text-[11px] font-mono text-slate-700 outline-none transition-colors focus:border-slate-300 focus:bg-white"
                            />
                            <button
                                type="button"
                                onClick={() => onUpdateFriendLastContact(reminder.friendId!)}
                                disabled={isUpdatingLastContact || !friendLastContactDate}
                                className="rounded-md border border-slate-200/70 px-2 py-1 text-[11px] font-mono text-emerald-600/80 transition-colors hover:bg-emerald-50/80 hover:text-emerald-700 disabled:opacity-30"
                                title="确认更新联系日期"
                            >
                                <Check size={13} />
                            </button>
                        </div>
                    )}
                    {/* 分隔 */}
                    <div className="h-5 w-px bg-amber-200/60" />
                    {/* 推迟提醒 */}
                    <div className="flex items-center gap-1.5">
                        <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            aria-label="推迟提醒天数"
                            value={friendSnoozeDays ?? `${DEFAULT_FRIEND_CONTACT_SNOOZE_DAYS}`}
                            onChange={(event) => onFriendSnoozeDaysChange?.(event.target.value)}
                            className="h-7 w-14 rounded-md border border-amber-200/70 bg-white/70 px-2 text-right text-[11px] font-mono text-amber-800 outline-none transition-colors focus:border-amber-300 focus:bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => onIgnoreFriendReminder(reminder.friendId!)}
                            className="rounded-md border border-amber-200/70 px-2 py-1 text-[11px] font-mono text-amber-700/80 transition-colors hover:bg-amber-100/60 hover:text-amber-800"
                        >
                            天后提醒
                        </button>
                    </div>
                </div>
            )}
            {reminder.kind === "rhythm" && reminder.rhythmCategory && onUpdateRhythmReminder && (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 font-sans">
                    <input
                        type="text"
                        aria-label="节奏事件名称"
                        placeholder="事件"
                        value={rhythmEventName ?? ""}
                        onChange={(event) => onRhythmEventNameChange?.(event.target.value)}
                        className={`h-7 w-[120px] rounded-md border px-2 text-[11px] outline-none transition-colors ${rhythmTheme?.input ?? "border-amber-200/70 bg-white/70 text-amber-900 placeholder:text-amber-700/35 focus:border-amber-300 focus:bg-white"}`}
                    />
                    <input
                        type="date"
                        aria-label="节奏事件日期"
                        value={rhythmEventDate ?? ""}
                        onChange={(event) => onRhythmEventDateChange?.(event.target.value)}
                        className={`h-7 w-[120px] rounded-md border px-2 text-[11px] font-mono outline-none transition-colors ${rhythmTheme?.input ?? "border-amber-200/70 bg-white/70 text-amber-900 focus:border-amber-300 focus:bg-white"}`}
                    />
                    <button
                        type="button"
                        onClick={() => onUpdateRhythmReminder(reminder.rhythmCategory!)}
                        disabled={isUpdatingRhythm || !rhythmEventName?.trim() || !rhythmEventDate}
                        className={`rounded-md border px-2 py-1 text-[11px] font-mono transition-colors disabled:opacity-30 ${rhythmTheme?.button ?? "border-amber-200/70 text-amber-700/80 hover:bg-amber-100/60 hover:text-amber-800"}`}
                        title="记录新事件"
                    >
                        {isUpdatingRhythm ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                </div>
            )}
            {reminder.action && (reminder.action === "calendar" ? onOpenCalendar : onOpenProtocol) && (
                <button
                    type="button"
                    onClick={reminder.action === "calendar" ? handleCalendar : handleProtocol}
                    className="text-[11px] font-mono opacity-70 hover:opacity-100 hover:underline shrink-0"
                >
                    {reminder.action === "calendar" ? "日历" : "Protocol"}
                </button>
            )}
        </li>
    );
}
