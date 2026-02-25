const STORAGE_KEY = "video_search_ui_logged_in";
const EMAIL_KEY = "video_search_ui_email";
const TOKEN_KEY = "video_search_ui_access_token";

// Cookie helper functions
function setCookie(name, value, days = 7) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Strict${secure}`;
  } catch (e) {
    console.error('Failed to set cookie:', e);
  }
}

function getCookie(name) {
  try {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  } catch (e) {
    console.error('Failed to get cookie:', e);
    return null;
  }
}

function deleteCookie(name) {
  try {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
  } catch (e) {
    console.error('Failed to delete cookie:', e);
  }
}

export function isLoggedIn() {
  try {
    return (
      getCookie(STORAGE_KEY) === "1" &&
      getCookie(EMAIL_KEY) !== null &&
      !!getCookie(TOKEN_KEY)
    );
  } catch {
    return false;
  }
}

export function getLoggedInEmail() {
  try {
    return getCookie(EMAIL_KEY) || "";
  } catch {
    return "";
  }
}

export function getAccessToken() {
  try {
    return getCookie(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setLoggedIn(email, accessToken) {
  setCookie(STORAGE_KEY, "1", 7); // 7 days expiry
  setCookie(EMAIL_KEY, String(email ?? ""), 7);
  if (accessToken) {
    setCookie(TOKEN_KEY, String(accessToken), 7);
  } else {
    deleteCookie(TOKEN_KEY);
  }
}

export function logout() {
  deleteCookie(STORAGE_KEY);
  deleteCookie(EMAIL_KEY);
  deleteCookie(TOKEN_KEY);
}
