export const GID_REGEX = /^[A-Za-z0-9]{118}$/;

/**
 * Try to extract the gid_ token from user input.
 * Accepts either a raw 118-char token or a URL containing gid_=... in query/hash.
 */
export function extractGid(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (GID_REGEX.test(trimmed)) return trimmed;

    try {
        const url = new URL(trimmed);
        const fromQuery = url.searchParams.get('gid_');
        if (fromQuery && GID_REGEX.test(fromQuery)) {
            return fromQuery;
        }
        if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
            const fromHash = hashParams.get('gid_');
            if (fromHash && GID_REGEX.test(fromHash)) {
                return fromHash;
            }
        }
    } catch {
        // Ignore parse error; fallback to regex search below.
    }

    const fallbackMatch = trimmed.match(/gid_=([A-Za-z0-9]{118})/);
    if (fallbackMatch) {
        return fallbackMatch[1];
    }
    return null;
}
