const OAUTH_RETURN_PATH_KEY = "oralcardio.oauth.return-path";

function safeInternalPath(path: string | null | undefined): string {
  if (!path?.startsWith("/")) return "/";

  try {
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export function saveOAuthReturnPath(path: string | undefined): void {
  sessionStorage.setItem(OAUTH_RETURN_PATH_KEY, safeInternalPath(path));
}

export function consumeOAuthReturnPath(): string {
  const path = sessionStorage.getItem(OAUTH_RETURN_PATH_KEY);
  sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
  return safeInternalPath(path);
}

export function clearOAuthReturnPath(): void {
  sessionStorage.removeItem(OAUTH_RETURN_PATH_KEY);
}
