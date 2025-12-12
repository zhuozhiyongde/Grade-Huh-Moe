'use client';

import { ChangeEvent, useId, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ScoreMode, SemesterMixMode, useOptions } from '@/context/OptionsContext';
import { GID_REGEX, extractGid } from '@/lib/gid';
import { fetchMedCampusGid } from '@/lib/pkuhscClient';

type HeaderProps = {
    onShowGidHelp: () => void;
};

export function Header({ onShowGidHelp }: HeaderProps) {
    const {
        username,
        mainPassword,
        medPassword,
        samePassword,
        gid,
        setUsername,
        setMainPassword,
        setMedPassword,
        setSamePassword,
        setGid,
    } = useAuth();
    const { mode, setMode, semesterMixMode, setSemesterMixMode } = useOptions();

    const [autoGidLoading, setAutoGidLoading] = useState(false);

    const usernameId = useId();
    const modeId = useId();
    const mainPasswordId = useId();
    const medPasswordId = useId();
    const samePasswordId = useId();
    const semesterMixId = useId();
    const gidId = useId();

    const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setMode(event.target.value as ScoreMode);
    };

    const handleSemesterMixChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setSemesterMixMode(event.target.value as SemesterMixMode);
    };

    const showMainPassword = mode === 'main' || mode === 'mixed';
    const showMedPasswordField = mode === 'med' || mode === 'mixed';
    const showSamePasswordToggle = mode === 'mixed';
    const showSemesterMixSelector = mode === 'mixed';
    const showGidField = showMedPasswordField;
    const usingSharedPassword = mode === 'mixed' && samePassword;
    const gidIsValid = GID_REGEX.test(gid.trim());
    const medPasswordToUse = usingSharedPassword ? mainPassword : medPassword;
    const medPasswordLabel = usingSharedPassword ? '本部密码' : '医学部密码';

    return (
        <header className="bg-white/[0.12] pb-2 rounded-b-3xl">
            <div className="w-[calc(100%-2*50px)] mx-[50px] max-[1300px]:w-[calc(100%-2*10px)] max-[1300px]:mx-2.5 text-white">
                <div className="text-[1.5em] py-4">
                    {' '}
                    <p className="flex items-center gap-4">
                        {' '}
                        <span className="flex-1 basis-0 h-px bg-white/60" aria-hidden="true"></span>{' '}
                        <span className="tracking-[0.2em] whitespace-nowrap shrink-0"> PKU 成绩查询 </span>{' '}
                        <span className="flex-1 basis-0 h-px bg-white/60" aria-hidden="true"></span>{' '}
                    </p>{' '}
                </div>
                <div className="flex flex-wrap items-center text-sm">
                    <div className="flex-grow">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 items-start max-[900px]:grid-cols-1">
                            <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs text-white/70 tracking-[0.08em]" htmlFor={usernameId}>
                                    学号
                                </label>
                                <input
                                    id={usernameId}
                                    type="text"
                                    className="w-full m-0 rounded-lg py-[0.35rem] px-3 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none placeholder:text-white/55 focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45 disabled:cursor-not-allowed disabled:bg-black/25 disabled:border-white/25 disabled:text-white/50"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-[0.4rem]">
                                <label className="text-xs text-white/70 tracking-[0.08em]" htmlFor={modeId}>
                                    模式
                                </label>
                                <select
                                    id={modeId}
                                    className="w-full m-0 rounded-lg py-[0.35rem] px-3 pr-10 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=\'http://www.w3.org/2000/svg\'_width=\'12\'_height=\'12\'_viewBox=\'0_0_12_12\'%3E%3Cpath_fill=\'rgba(255,255,255,0.7)\'_d=\'M6_9L1_4h10z\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:12px] focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45"
                                    value={mode}
                                    onChange={handleModeChange}>
                                    <option value="main">本部</option>
                                    <option value="med">医学部</option>
                                    <option value="mixed">混合模式</option>
                                </select>
                            </div>
                            {showMainPassword && (
                                <div
                                    className={`flex flex-col gap-[0.4rem]${
                                        mode === 'main' ? ' col-span-2 max-[900px]:col-span-1' : ''
                                    }`}>
                                    <label className="text-xs text-white/70 tracking-[0.08em]" htmlFor={mainPasswordId}>
                                        本部密码
                                    </label>
                                    <input
                                        id={mainPasswordId}
                                        type="password"
                                        className="w-full m-0 rounded-lg py-[0.35rem] px-3 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none placeholder:text-white/55 focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45 disabled:cursor-not-allowed disabled:bg-black/25 disabled:border-white/25 disabled:text-white/50"
                                        value={mainPassword}
                                        onChange={(event) => setMainPassword(event.target.value)}
                                    />
                                </div>
                            )}
                            {showMedPasswordField && (
                                <div
                                    className={`flex flex-col gap-[0.4rem]${
                                        mode === 'med' ? ' col-span-2 max-[900px]:col-span-1' : ''
                                    }`}>
                                    <label
                                        className="text-xs text-white/70 tracking-[0.08em]"
                                        htmlFor={medPasswordId}
                                        title={
                                            usingSharedPassword ? '登录时沿用本部密码（仍会保存此处输入）' : undefined
                                        }>
                                        医学部密码
                                    </label>
                                    <input
                                        id={medPasswordId}
                                        type="password"
                                        className="w-full m-0 rounded-lg py-[0.35rem] px-3 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none placeholder:text-white/55 focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45 disabled:cursor-not-allowed disabled:bg-black/25 disabled:border-white/25 disabled:text-white/50"
                                        value={medPassword}
                                        onChange={(event) => setMedPassword(event.target.value)}
                                        disabled={usingSharedPassword}
                                        aria-disabled={usingSharedPassword}
                                    />
                                </div>
                            )}
                            {showGidField && (
                                <div className="flex flex-col gap-[0.4rem] col-span-2 max-[900px]:col-span-1">
                                    <label
                                        className="text-xs text-white/70 tracking-[0.08em] flex items-center gap-2"
                                        htmlFor={gidId}>
                                        GID
                                        <button
                                            type="button"
                                            onClick={onShowGidHelp}
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-xs font-semibold text-white/80 transition hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                            aria-label="如何获取 GID">
                                            ?
                                        </button>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id={gidId}
                                            type="text"
                                            className="flex-1 w-full m-0 rounded-lg py-[0.35rem] px-3 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none placeholder:text-white/55 focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45"
                                            placeholder="粘贴包含 gid_ 参数的链接或直接输入 GID"
                                            value={gid}
                                            onChange={(event) => setGid(event.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="rounded-md border border-white/50 px-3 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
                                            onClick={() => {
                                                const parsed = extractGid(gid);
                                                if (parsed) {
                                                    if (!gidIsValid || parsed !== gid) {
                                                        setGid(parsed);
                                                    }
                                                    window.alert('已解析出 GID，请确认后再查询。');
                                                } else {
                                                    window.alert('未能解析出有效的 GID，请粘贴包含 gid_ 参数的链接。');
                                                }
                                            }}>
                                            解析
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded-md border border-white/50 px-3 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
                                            disabled={autoGidLoading}
                                            onClick={async () => {
                                                const normalizedUsername = username.trim();
                                                if (!normalizedUsername) {
                                                    window.alert('请先填写学号');
                                                    return;
                                                }
                                                if (!medPasswordToUse) {
                                                    window.alert(`请先填写${medPasswordLabel}`);
                                                    return;
                                                }

                                                setAutoGidLoading(true);
                                                try {
                                                    const result = await fetchMedCampusGid({
                                                        username: normalizedUsername,
                                                        password: medPasswordToUse,
                                                    });
                                                    if (!result.success) {
                                                        window.alert(result.errMsg || '自动获取 GID 失败');
                                                        return;
                                                    }
                                                    setGid(result.gid);
                                                    window.alert('已自动获取 GID，并已填入。');
                                                } finally {
                                                    setAutoGidLoading(false);
                                                }
                                            }}>
                                            {autoGidLoading ? '获取中…' : '自动获取'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {showSamePasswordToggle && (
                                <div className="flex flex-col gap-[0.4rem]">
                                    <span className="text-xs text-white/70 tracking-[0.08em]">密码一致</span>
                                    <label
                                        className="inline-flex items-center gap-[0.4rem] text-[0.8rem] text-white/80 cursor-pointer w-full py-[0.35rem] px-3 rounded-lg border border-white/45 bg-black/35 min-h-8 transition-[border-color,box-shadow,background-color] duration-150 hover:border-[rgba(173,216,230,0.7)] focus-within:border-[rgba(173,216,230,0.9)] focus-within:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus-within:bg-black/45"
                                        htmlFor={samePasswordId}>
                                        <input
                                            id={samePasswordId}
                                            type="checkbox"
                                            checked={samePassword}
                                            onChange={(event) => setSamePassword(event.target.checked)}
                                            className="appearance-none grid place-items-center m-0 w-[1.05rem] h-[1.05rem] rounded-sm border-[1.5px] border-white/60 bg-black/20 transition-[border-color,background-color] duration-150 after:content-[''] after:w-[0.45rem] after:h-[0.75rem] after:border-[0.18rem] after:border-transparent after:border-l-0 after:border-t-0 after:rotate-45 after:-mt-[0.05rem] checked:border-[rgba(173,216,230,0.9)] checked:bg-[rgba(173,216,230,0.2)] checked:after:border-[rgba(173,216,230,0.9)] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus-visible:border-[rgba(173,216,230,0.9)] !h-4 !w-4"
                                        />
                                        <span className="text-xs">医学部沿用本部密码</span>
                                    </label>
                                </div>
                            )}
                            {showSemesterMixSelector && (
                                <div className="flex flex-col gap-[0.4rem]">
                                    <label className="text-xs text-white/70 tracking-[0.08em]" htmlFor={semesterMixId}>
                                        学期内混合方式
                                    </label>
                                    <select
                                        id={semesterMixId}
                                        className="w-full m-0 rounded-lg py-[0.35rem] px-3 pr-10 border border-white/45 bg-black/35 text-inherit font-[var(--font-geist-mono),ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation_Mono','Courier_New',monospace] text-xs transition-[border-color,box-shadow] duration-150 min-h-8 appearance-none bg-[url('data:image/svg+xml,%3Csvg_xmlns=\'http://www.w3.org/2000/svg\'_width=\'12\'_height=\'12\'_viewBox=\'0_0_12_12\'%3E%3Cpath_fill=\'rgba(255,255,255,0.7)\'_d=\'M6_9L1_4h10z\'/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:12px] focus:outline-none focus:border-[rgba(173,216,230,0.9)] focus:shadow-[0_0_0_2px_rgba(173,216,230,0.35)] focus:bg-black/45"
                                        value={semesterMixMode}
                                        onChange={handleSemesterMixChange}>
                                        <option value="merge">混合</option>
                                        <option value="split">分列</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-sm mt-2 text-gray-200">
                    注：医学部成绩源包含本部成绩，但一般来说有所迟滞，只有在学期初才会结算上学期的成绩。选用混合模式以获得更及时的本部成绩更新。
                </div>
            </div>
        </header>
    );
}
