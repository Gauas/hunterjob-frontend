export const LOCAL_ACCESS_TOKEN_KEY = "hunterjob.access_token";
export const LOCAL_REFRESH_TOKEN_KEY = "hunterjob.refresh_token";

export type LocalTokenPair = {
  access_token: string;
  refresh_token: string;
};

export function hasLocalSession() {
  return Boolean(window.localStorage.getItem(LOCAL_ACCESS_TOKEN_KEY));
}

export function localAccessToken() {
  return window.localStorage.getItem(LOCAL_ACCESS_TOKEN_KEY) ?? "";
}

export function persistLocalSession(tokens: LocalTokenPair) {
  window.localStorage.setItem(LOCAL_ACCESS_TOKEN_KEY, tokens.access_token);
  window.localStorage.setItem(LOCAL_REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearLocalSession() {
  window.localStorage.removeItem(LOCAL_ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(LOCAL_REFRESH_TOKEN_KEY);
}
