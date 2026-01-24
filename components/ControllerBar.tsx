'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGradePreset } from '@/context/GradePresetContext';
import { useOptions } from '@/context/OptionsContext';
import { RelativeTime } from '@/components/RelativeTime';
import { CustomPresetEditor } from '@/components/CustomPresetEditor';
import { IconRefresh, IconShow, IconHide, IconDisplay, IconEdit } from '@/components/Icons';
import { PRESETS, type PresetId } from '@/lib/gradePresets';

const AUTO_RELOAD_INTERVAL_MS = 300_000;

export function ControllerBar() {
    const { load } = useAuth();
    const { hideText, judgeByGpa, collapseAllSemesters, toggleHideText, toggleJudgeByGpa, toggleCollapseAllSemesters } =
        useOptions();
    const { presetId, setPresetId } = useGradePreset();

    const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
    const [nextUpdate, setNextUpdate] = useState<number | null>(null);
    const [showCustomEditor, setShowCustomEditor] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const toggleAutoReload = () => {
        if (autoReloadEnabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = null;
            setAutoReloadEnabled(false);
            setNextUpdate(null);
            return;
        }

        const scheduleNext = () => {
            setNextUpdate(Date.now() + AUTO_RELOAD_INTERVAL_MS);
        };

        scheduleNext();
        intervalRef.current = setInterval(() => {
            load().catch((error) => console.error('Auto reload failed', error));
            scheduleNext();
        }, AUTO_RELOAD_INTERVAL_MS);
        setAutoReloadEnabled(true);
    };

    return (
        <>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mx-auto w-full max-w-5xl mt-8 text-[0.8em] print:hidden">
                <button
                    type="button"
                    onClick={toggleAutoReload}
                    className="bg-none border-none text-[lightblue] cursor-pointer inline-flex items-center gap-[0.35em] p-0 font-inherit disabled:opacity-60 disabled:cursor-not-allowed">
                    <IconRefresh />
                    {autoReloadEnabled ? (
                        <RelativeTime value={nextUpdate} refreshIntervalMs={1_000} suffix=" 刷新" fallback="即将刷新" />
                    ) : (
                        <span>自动刷新</span>
                    )}
                </button>
                <button
                    type="button"
                    onClick={toggleHideText}
                    className="bg-none border-none text-[lightblue] cursor-pointer inline-flex items-center gap-[0.35em] p-0 font-inherit disabled:opacity-60 disabled:cursor-not-allowed">
                    {hideText ? <IconShow /> : <IconHide />}
                    <span>{hideText ? '显示文字' : '隐藏文字'}</span>
                </button>
                <button
                    type="button"
                    onClick={toggleJudgeByGpa}
                    className="bg-none border-none text-[lightblue] cursor-pointer inline-flex items-center gap-[0.35em] p-0 font-inherit disabled:opacity-60 disabled:cursor-not-allowed"
                    title={
                        judgeByGpa
                            ? '当前四分制着色，GPA 从 1 至 4 由红变绿'
                            : '当前百分制着色，分数从 60 至 100 由红变绿'
                    }>
                    <IconDisplay />
                    <span>{judgeByGpa ? '百分制着色' : '四分制着色'}</span>
                </button>
                <button
                    type="button"
                    onClick={toggleCollapseAllSemesters}
                    className="bg-none border-none text-[lightblue] cursor-pointer inline-flex items-center gap-[0.35em] p-0 font-inherit disabled:opacity-60 disabled:cursor-not-allowed">
                    {collapseAllSemesters ? <IconShow /> : <IconHide />}
                    <span>{collapseAllSemesters ? '展开学期' : '折叠学期'}</span>
                </button>
                <span className="inline-flex items-center gap-[0.35em] w-full justify-center md:w-auto">
                    <span className="text-[lightblue]">等级制换算规则：</span>
                    <select
                        value={presetId}
                        onChange={(e) => {
                            const newId = e.target.value as PresetId;
                            setPresetId(newId);
                            if (newId === 'custom') {
                                setShowCustomEditor(true);
                            }
                        }}
                        className="bg-transparent border border-[lightblue] text-[lightblue] cursor-pointer px-2 py-0.5 rounded text-[0.9em] appearance-none pr-6 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%23add8e6%22%20d%3D%22M2%204l4%204%204-4%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.5rem_center] bg-[length:10px]"
                        title="等级制成绩转换规则">
                        {Object.values(PRESETS).map((preset) => (
                            <option key={preset.id} value={preset.id} className="bg-[#333] text-white">
                                {preset.name}
                            </option>
                        ))}
                    </select>
                    {presetId === 'custom' && (
                        <button
                            type="button"
                            onClick={() => setShowCustomEditor(true)}
                            className="bg-none border-none text-[lightblue] cursor-pointer p-0 font-inherit"
                            title="编辑自定义规则">
                            <IconEdit />
                        </button>
                    )}
                </span>
            </div>
            {showCustomEditor && <CustomPresetEditor onClose={() => setShowCustomEditor(false)} />}
        </>
    );
}
