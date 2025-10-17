'use client';

import { ChangeEvent, useId } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ScoreMode, SemesterMixMode, useOptions } from '@/context/OptionsContext';
import { GID_REGEX, extractGid } from '@/lib/gid';

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

    return (
        <header className="title-bar">
            <div className="aux-margin text-white">
                <div className="title">
                    <p className="centered-line">PKU 成绩查询</p>
                </div>
                <div className="flex flex-wrap items-center text-sm">
                    <div className="flex-grow">
                        <div className="login-grid">
                            <div className="login-field">
                                <label className="login-field-label" htmlFor={usernameId}>
                                    学号
                                </label>
                                <input
                                    id={usernameId}
                                    type="text"
                                    className="login-input"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                />
                            </div>
                            <div className="login-field">
                                <label className="login-field-label" htmlFor={modeId}>
                                    模式
                                </label>
                                <select id={modeId} className="login-input" value={mode} onChange={handleModeChange}>
                                    <option value="main">本部</option>
                                    <option value="med">医学部</option>
                                    <option value="mixed">混合模式</option>
                                </select>
                            </div>
                            {showMainPassword && (
                                <div className={`login-field${mode === 'main' ? ' login-field--span-2' : ''}`}>
                                    <label className="login-field-label" htmlFor={mainPasswordId}>
                                        本部密码
                                    </label>
                                    <input
                                        id={mainPasswordId}
                                        type="password"
                                        className="login-input"
                                        value={mainPassword}
                                        onChange={(event) => setMainPassword(event.target.value)}
                                    />
                                </div>
                            )}
                            {showMedPasswordField && (
                                <div className={`login-field${mode === 'med' ? ' login-field--span-2' : ''}`}>
                                    <label
                                        className="login-field-label"
                                        htmlFor={medPasswordId}
                                        title={usingSharedPassword ? '登录时沿用本部密码（仍会保存此处输入）' : undefined}>
                                        医学部密码
                                    </label>
                                    <input
                                        id={medPasswordId}
                                        type="password"
                                        className="login-input"
                                        value={medPassword}
                                        onChange={(event) => setMedPassword(event.target.value)}
                                        disabled={usingSharedPassword}
                                        aria-disabled={usingSharedPassword}
                                    />
                                </div>
                            )}
                            {showGidField && (
                                <div className="login-field login-field--span-2">
                                    <label className="login-field-label flex items-center gap-2" htmlFor={gidId}>
                                        GID
                                        <button
                                            type="button"
                                            onClick={onShowGidHelp}
                                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60 text-xs font-semibold text-white/80 transition hover:border-white hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                            aria-label="如何获取 GID"
                                        >
                                            ?
                                        </button>
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            id={gidId}
                                            type="text"
                                            className="login-input flex-1"
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
                                            }}
                                        >
                                            解析
                                        </button>
                                    </div>
                                </div>
                            )}
                            {showSamePasswordToggle && (
                                <div className="login-field">
                                    <span className="login-field-label">密码一致</span>
                                    <label className="login-checkbox" htmlFor={samePasswordId}>
                                        <input
                                            id={samePasswordId}
                                            type="checkbox"
                                            checked={samePassword}
                                            onChange={(event) => setSamePassword(event.target.checked)}
                                            className="!h-4 !w-4"
                                        />
                                        <span className="text-xs">医学部沿用本部密码</span>
                                    </label>
                                </div>
                            )}
                            {showSemesterMixSelector && (
                                <div className="login-field">
                                    <label className="login-field-label" htmlFor={semesterMixId}>
                                        学期内混合方式
                                    </label>
                                    <select
                                        id={semesterMixId}
                                        className="login-input"
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
