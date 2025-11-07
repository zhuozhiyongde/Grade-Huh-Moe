import { createCipheriv, randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { Agent } from 'undici';

const AES_CHARS = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';
const GRADE_INDEX_URL = 'https://apps.bjmu.edu.cn/jwapp/sys/cjcx/*default/index.do';
const GRADE_QUERY_URL = 'https://apps.bjmu.edu.cn/jwapp/sys/cjcx/modules/cjcx/xscjcx.do';
const GRADE_SERVICE_GID =
    'V3hMVFErb1V5QzlMTmVSUFZNd3E0Z3kxQzRxeE1VQWlPemFDQnJJWVV2cUNBQzVLVWVDM0R0Q2VRbzNPM1Q4MDlKQlcxK2NDWXFKZXVndkFvaXlFdnc9PQ';
const GID_LENGTH = 118;
const GID_ALLOWED = /^[A-Za-z0-9]+$/;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const LOG_PREFIX = '[PKUHSC]';
const INPUT_TAG_REGEX = /<input\b[^>]*>/gi;
const VALUE_ATTR_REGEX = /value\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+))/i;

const baseHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    Connection: 'keep-alive',
} as const;

const insecureAgent = new Agent({
    connect: {
        rejectUnauthorized: false,
    },
});

type CredentialPayload = {
    username?: string;
    password?: string;
    gid?: string | null;
};

type NodeRequestInit = RequestInit & {
    dispatcher?: Agent;
    maxRedirects?: number;
};

function logError(message: string, meta?: Record<string, unknown>) {
    if (meta) {
        console.error(`${LOG_PREFIX} ${message}`, meta);
        return;
    }
    console.error(`${LOG_PREFIX} ${message}`);
}

class SimpleCookieJar {
    private store = new Map<string, Map<string, string>>();

    set(domain: string, name: string, value: string) {
        const normalized = domain.replace(/^\./, '').toLowerCase();
        if (!this.store.has(normalized)) {
            this.store.set(normalized, new Map());
        }
        this.store.get(normalized)!.set(name, value);
    }

    getHeader(url: string) {
        const host = new URL(url).hostname.toLowerCase();
        const parts: string[] = [];
        for (const [domain, cookies] of this.store.entries()) {
            if (host === domain || host.endsWith(`.${domain}`)) {
                for (const [name, value] of cookies.entries()) {
                    parts.push(`${name}=${value}`);
                }
            }
        }
        return parts.join('; ');
    }
}

function storeCookies(jar: SimpleCookieJar, response: Response, url: string) {
    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (!setCookies.length) return;
    const originHost = new URL(url).hostname;

    for (const cookieEntry of setCookies) {
        const segments = cookieEntry.split(';');
        const [nameValue, ...attrs] = segments;
        if (!nameValue) continue;
        const eqIndex = nameValue.indexOf('=');
        if (eqIndex === -1) continue;
        const name = nameValue.slice(0, eqIndex).trim();
        const value = nameValue.slice(eqIndex + 1).trim();
        if (!name) continue;

        let domain = originHost;
        for (const attr of attrs) {
            const [key, attrValue] = attr.split('=');
            if (key && key.trim().toLowerCase() === 'domain' && attrValue) {
                domain = attrValue.trim();
                break;
            }
        }

        jar.set(domain, name, value);
    }
}

async function fetchWithCookies(inputUrl: string, jar: SimpleCookieJar, options: NodeRequestInit = {}) {
    const { maxRedirects = 10, ...rest } = options;
    let currentUrl = inputUrl;
    let currentOptions: NodeRequestInit = {
        ...rest,
    };

    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
        const headers = new Headers(currentOptions.headers ?? {});
        const cookieHeader = jar.getHeader(currentUrl);
        if (cookieHeader) {
            headers.set('cookie', cookieHeader);
        }

        const finalOptions: NodeRequestInit = {
            ...currentOptions,
            redirect: 'manual',
            dispatcher: insecureAgent,
            headers,
        };

        const response = await fetch(currentUrl, finalOptions);
        storeCookies(jar, response, currentUrl);

        if (!REDIRECT_STATUSES.has(response.status)) {
            return { response, url: currentUrl };
        }

        const location = response.headers.get('location');
        if (!location) {
            throw new Error('收到重定向但缺少 Location 头');
        }
        currentUrl = new URL(location, currentUrl).toString();

        const status = response.status;
        if (
            status === 303 ||
            (status === 302 &&
                currentOptions.method &&
                currentOptions.method !== 'GET' &&
                currentOptions.method !== 'HEAD')
        ) {
            currentOptions = {
                ...currentOptions,
                method: 'GET',
                body: undefined,
            };
        }
    }

    throw new Error('重定向次数过多');
}

function isValidGid(value: string) {
    return value.length === GID_LENGTH && GID_ALLOWED.test(value);
}

function buildLoginUrl(gid: string) {
    const timestamp = Date.now();
    const service = `${GRADE_INDEX_URL}?t_s=${timestamp}&amp_sec_version_=1&gid_=${gid}&EMAP_LANG=zh&THEME=bjmu#/cjcx`;
    const encoded = strictEncodeURIComponent(service);
    return `https://auth.bjmu.edu.cn/authserver/login?service=${encoded}`;
}

function strictEncodeURIComponent(value: string) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function escapeForRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAttrRegex(attr: 'id' | 'name', attrValue: string) {
    const escapedAttr = escapeForRegex(attr);
    const escapedValue = escapeForRegex(attrValue);
    return new RegExp(`${escapedAttr}\\s*=\\s*(?:"${escapedValue}"|'${escapedValue}'|${escapedValue}(?=[\\s>/]))`, 'i');
}

function readInputValue(tags: string[], attr: 'id' | 'name', attrValue: string) {
    const targetAttrRegex = buildAttrRegex(attr, attrValue);
    for (const tag of tags) {
        if (!targetAttrRegex.test(tag)) continue;
        const valueMatch = tag.match(VALUE_ATTR_REGEX);
        if (valueMatch) {
            return valueMatch[1] ?? valueMatch[2] ?? valueMatch[3] ?? null;
        }
    }
    return null;
}

function randomString(length: number) {
    const bytes = randomBytes(length);
    let result = '';
    for (let i = 0; i < length; i += 1) {
        result += AES_CHARS[bytes[i] % AES_CHARS.length];
    }
    return result;
}

function encryptPassword(password: string, salt: string) {
    const randomPrefix = randomString(64);
    const iv = randomString(16);
    const payload = Buffer.from(randomPrefix + password, 'utf-8');
    const keyBuffer = Buffer.from(salt, 'utf-8');
    const key =
        keyBuffer.length >= 16
            ? keyBuffer.subarray(0, 16)
            : Buffer.concat([keyBuffer, Buffer.alloc(16)]).subarray(0, 16);
    const cipher = createCipheriv('aes-128-cbc', key, Buffer.from(iv, 'utf-8'));
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    return encrypted.toString('base64');
}

function ensureField(value: string | null, label: string) {
    if (value === null || value === undefined) {
        throw new Error(`${label} 缺失，无法继续登录`);
    }
    return value;
}

function buildGradePayload() {
    const payload = new URLSearchParams();
    payload.set(
        'querySetting',
        JSON.stringify(
            [
                {
                    name: 'SFYX',
                    caption: '是否有效',
                    linkOpt: 'AND',
                    builderList: 'cbl_m_List',
                    builder: 'm_value_equal',
                    value: '1',
                    value_display: '是',
                },
                {
                    name: 'SHOWMAXCJ',
                    caption: '显示最高成绩',
                    linkOpt: 'AND',
                    builderList: 'cbl_m_List',
                    builder: 'm_value_equal',
                    value: 0,
                    value_display: '否',
                },
            ],
            null,
            0
        )
    );
    payload.set('*order', '-XNXQDM,-KCH,-KXH');
    payload.set('pageSize', '999');
    payload.set('pageNumber', '1');
    return payload;
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as CredentialPayload;
        const username = body.username?.trim();
        const password = body.password ?? '';
        const rawGid = body.gid?.trim();

        if (!username || !password) {
            return Response.json({ success: false, errMsg: '请填写完整的账号和密码' }, { status: 400 });
        }

        if (rawGid && !isValidGid(rawGid)) {
            return Response.json({ success: false, errMsg: 'GID 格式不正确，请重新填写' }, { status: 400 });
        }

        const gid = rawGid || GRADE_SERVICE_GID;
        const jar = new SimpleCookieJar();

        const loginUrl = buildLoginUrl(gid);
        const loginPage = await fetchWithCookies(loginUrl, jar, {
            headers: baseHeaders,
        });
        if (!loginPage.response.ok) {
            throw new Error(`登录页请求失败（${loginPage.response.status}）`);
        }

        const html = await loginPage.response.text();
        const inputTags = html.match(INPUT_TAG_REGEX) ?? [];
        const ltRaw = readInputValue(inputTags, 'name', 'lt');
        const executionRaw = readInputValue(inputTags, 'name', 'execution');
        const saltRaw = readInputValue(inputTags, 'id', 'pwdEncryptSalt');
        const lt = ensureField(ltRaw, 'lt');
        const execution = ensureField(executionRaw, 'execution');
        const salt = ensureField(saltRaw, 'pwdEncryptSalt');

        const encrypted = encryptPassword(password, salt);
        const formData = new URLSearchParams();
        formData.set('username', username);
        formData.set('password', encrypted);
        formData.set('captcha', '');
        formData.set('_eventId', 'submit');
        formData.set('cllt', 'userNameLogin');
        formData.set('dllt', 'generalLogin');
        formData.set('lt', lt);
        formData.set('execution', execution);
        formData.set('rmShown', '1');

        const loginResult = await fetchWithCookies(loginPage.url, jar, {
            method: 'POST',
            body: formData.toString(),
            headers: {
                ...baseHeaders,
                'Content-Type': 'application/x-www-form-urlencoded',
                Origin: 'https://auth.bjmu.edu.cn',
                Referer: loginPage.url,
            },
        });

        if (!loginResult.response.ok) {
            throw new Error(`统一身份认证失败（${loginResult.response.status}）`);
        }

        const loginContent = await loginResult.response.text();
        if (loginContent.includes('统一身份认证平台')) {
            throw new Error('统一身份认证失败，请检查账号或密码');
        }

        const gradePayload = buildGradePayload();
        const gradeResponse = await fetchWithCookies(GRADE_QUERY_URL, jar, {
            method: 'POST',
            body: gradePayload.toString(),
            headers: {
                ...baseHeaders,
                Origin: 'https://apps.bjmu.edu.cn',
                Referer: loginResult.url || GRADE_INDEX_URL,
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            },
        });

        if (!gradeResponse.response.ok) {
            throw new Error(`成绩接口请求失败（${gradeResponse.response.status}）`);
        }

        const data = await gradeResponse.response.json();

        if (data?.code !== '0' && data?.code !== 0) {
            throw new Error('医学部成绩接口返回错误');
        }

        return Response.json({ success: true, data });
    } catch (error) {
        const message = error instanceof Error ? error.message : '医学部成绩获取失败';
        logError('接口调用失败', {
            errMsg: message,
            stack: error instanceof Error ? error.stack : undefined,
        });
        return Response.json({ success: false, errMsg: message }, { status: 500 });
    }
}
