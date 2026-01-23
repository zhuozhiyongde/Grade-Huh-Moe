'use client';

import { useState } from 'react';
import { useGradePreset } from '@/context/GradePresetContext';
import {
    ConversionStrategy,
    LETTER_GRADES,
    LetterGrade,
    LetterGradeMapping,
} from '@/lib/gradePresets';

type CustomPresetEditorProps = {
    onClose: () => void;
};

export function CustomPresetEditor({ onClose }: CustomPresetEditorProps) {
    const { customMappings, customStrategy, setCustomMappings, setCustomStrategy } = useGradePreset();

    const [localMappings, setLocalMappings] = useState<LetterGradeMapping>(customMappings);
    const [localStrategy, setLocalStrategy] = useState<ConversionStrategy>(customStrategy);

    const handleValueChange = (grade: LetterGrade, value: string) => {
        const numValue = value === '' ? NaN : parseFloat(value);
        setLocalMappings((prev) => ({
            ...prev,
            [grade]: { value: numValue },
        }));
    };

    const handleSave = () => {
        setCustomMappings(localMappings);
        setCustomStrategy(localStrategy);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
            onClick={handleBackdropClick}
        >
            <div className="max-h-[85vh] w-full max-w-md overflow-hidden bg-[#222] text-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] border border-white/[0.18] flex flex-col">
                <div className="p-6 overflow-y-auto flex flex-col gap-4">
                    <h2 className="text-lg font-bold">自定义等级制转换</h2>

                    {/* Strategy selector */}
                    <div>
                        <label className="block text-sm text-white/70 mb-2">转换方式</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-white/90 cursor-pointer text-sm">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="direct_gpa"
                                    checked={localStrategy === 'direct_gpa'}
                                    onChange={() => setLocalStrategy('direct_gpa')}
                                    className="accent-[lightblue]"
                                />
                                直接映射 GPA
                            </label>
                            <label className="flex items-center gap-2 text-white/90 cursor-pointer text-sm">
                                <input
                                    type="radio"
                                    name="strategy"
                                    value="score_to_gpa"
                                    checked={localStrategy === 'score_to_gpa'}
                                    onChange={() => setLocalStrategy('score_to_gpa')}
                                    className="accent-[lightblue]"
                                />
                                转换为百分制
                            </label>
                        </div>
                    </div>

                    {/* Mappings table */}
                    <div>
                        <div className="flex text-sm text-white/70 mb-2 px-1">
                            <span className="w-16">等级</span>
                            <span className="flex-1">
                                {localStrategy === 'direct_gpa' ? 'GPA (0-4)' : '百分制 (0-100)'}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {LETTER_GRADES.map((grade) => (
                                <div key={grade} className="flex items-center gap-2">
                                    <span className="w-16 font-mono text-white/90 text-sm pl-1">{grade}</span>
                                    <input
                                        type="number"
                                        step={localStrategy === 'direct_gpa' ? '0.1' : '1'}
                                        min="0"
                                        max={localStrategy === 'direct_gpa' ? '4' : '100'}
                                        value={Number.isNaN(localMappings[grade].value) ? '' : localMappings[grade].value}
                                        onChange={(e) => handleValueChange(grade, e.target.value)}
                                        placeholder="留空不计算"
                                        className="flex-1 bg-black/35 text-white px-2 py-1.5 rounded-lg border border-white/45 text-sm placeholder:text-white/40 focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 px-6 pb-6 pt-4 bg-white/5 border-t border-white/[0.08]">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-1.5 text-white/70 hover:text-white transition-colors text-sm"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-1.5 bg-[rgba(173,216,230,0.2)] text-[lightblue] rounded-full border border-[lightblue] hover:bg-[rgba(173,216,230,0.3)] transition-colors text-sm"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
}
