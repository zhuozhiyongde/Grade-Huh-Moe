'use client';

import { useEffect, useState } from 'react';
import { ControllerBar } from '@/components/ControllerBar';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { QueryButton } from '@/components/QueryButton';
import { Viewer } from '@/components/viewer/Viewer';
import { useScoreContext } from '@/context/ScoreContext';

const EULA_KEY = 'EULA';

export default function Home() {
    const { hasData } = useScoreContext();
    const [eulaAccepted, setEulaAccepted] = useState(true);
    const [showGidHelp, setShowGidHelp] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const accepted = localStorage.getItem(EULA_KEY) === 'accepted';
        setEulaAccepted(accepted);
    }, []);

    const handleAcceptEula = () => {
        setEulaAccepted(true);
        localStorage.setItem(EULA_KEY, 'accepted');
        if (typeof window !== 'undefined' && 'Notification' in window) {
            Notification.requestPermission().catch(() => {});
        }
    };

    const handleDeclineEula = () => {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(EULA_KEY);
        window.location.href = 'about:blank';
    };

    return (
        <main className="pb-12 text-white">
            <div className="legacy-container px-4">
                <Header
                    onShowGidHelp={() => {
                        setShowGidHelp(true);
                    }}
                />
                <ControllerBar />
                {hasData ? <Viewer /> : <QueryButton />}
                <Footer onShowEula={() => setEulaAccepted(false)} />
            </div>
            {!eulaAccepted && <EulaModal onAccept={handleAcceptEula} onDecline={handleDeclineEula} />}
            {showGidHelp && <GidHelpModal onClose={() => setShowGidHelp(false)} />}
        </main>
    );
}

type EulaModalProps = {
    onAccept: () => void;
    onDecline: () => void;
};

function EulaModal({ onAccept, onDecline }: EulaModalProps) {
    return (
        <div className="modal-overlay">
            <div className="legacy-modal">
                <div className="legacy-modal__body gap-y-4">
                    <h2 className="text-lg font-semibold">用户须知</h2>
                    <p className="font-medium">
                        请仔细阅读以下内容。点击“继续”按钮或使用本网站的任何功能即视为您同意以下条款。
                    </p>
                    <p>本网站是北大树洞成绩查询页面的重新实现，本网站将使用以下两种方式以获取您的成绩信息：</p>
                    <ul className="list-disc space-y-1 pl-6">
                        <li>对于本部成绩：使用北京大学统一认证 API 接口获取</li>
                        <li>使用医学部成绩：通过发往后端服务器来获取您的成绩信息</li>
                    </ul>
                    <p>
                        <strong className="text-red-500">本网站承诺不会收集您的任何认证凭证。</strong>
                    </p>
                    <p>
                        对于本部成绩：您的账号密码不会经过我们的后端服务器，而是直接发往北京大学统一认证服务器（iaaa.pku.edu.cn）。本网站将利用该服务器返回的令牌以获取您的成绩信息。
                    </p>
                    <p>
                        对于医学部成绩：由于医学部后端存在 CORS
                        跨域限制，所以必须通过将您的账号密码发往我们的后端，然后自动化请求北医综合服务平台（apps.bjmu.edu.cn）来获取您的成绩信息。
                        您的账号密码发往后端后会被一次性的使用，不会被存储或泄露。后端代码我们将会在 GitHub
                        上开源以供审计。
                    </p>
                    <p>如果您不信任我们的承诺，您可以选择关闭本网页。</p>
                    <p>
                        您的账号密码将仅存储在浏览器端的本地存储（Local
                        Storage）以方便后续输入，您可以通过清理缓存来清除这些数据。
                    </p>
                </div>
                <div className="legacy-modal__actions">
                    <button type="button" onClick={onDecline} className="legacy-modal__button">
                        拒绝
                    </button>
                    <button
                        type="button"
                        onClick={onAccept}
                        className="legacy-modal__button legacy-modal__button--primary">
                        继续
                    </button>
                </div>
            </div>
        </div>
    );
}

type GidHelpModalProps = {
    onClose: () => void;
};

function GidHelpModal({ onClose }: GidHelpModalProps) {
    return (
        <div className="modal-overlay">
            <div className="legacy-modal max-w-xl">
                <div className="legacy-modal__body gap-y-3">
                    <h2 className="text-lg font-semibold">如何获取 GID</h2>
                    <p>GID 是医学部成绩系统用于定位服务的参数。</p>
                    <p className="text-cyan-500">仅初次使用时需要提供，后续可以保存无需再次提供！</p>
                    <p>其可按照以下步骤获取：</p>
                    <ol className="list-decimal space-y-1 pl-6 text-sm leading-relaxed text-gray-200">
                        <li>
                            在浏览器中登录北医综合服务平台，然后访问其{' '}
                            <a
                                href="https://apps.bjmu.edu.cn/jwapp/sys/cjcx/*default/index.do"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="!text-cyan-500">
                                成绩查询页面
                            </a>
                            。
                        </li>
                        <li>
                            到达成绩查询页面后，直接在地址栏中复制完整链接，链接中应当包含 <code>gid_=...</code>{' '}
                            参数，您可以直接返回到本页面并粘贴该链接，然后点击“解析”按钮测试是否可以正确解析。
                        </li>
                        <li>如果链接正确，系统会自动提取 118 位的 GID，并进行存储。</li>
                    </ol>
                    <p>如遇解析失败，请确认链接仍然有效或重新访问成绩查询页面获取最新的 GID。</p>
                    <p><del className="text-sm">抱歉主播太菜了，没能找到自动获取 GID 的方法，给大家带来不便了 orz</del></p>
                </div>
                <div className="legacy-modal__actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="legacy-modal__button legacy-modal__button--primary">
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );
}
