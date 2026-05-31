// Empty string uses Vite dev proxy (/api → backend). Set VITE_API_URL in production.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

const TOKEN_KEY = "cloudware_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* non-json response */
  }
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function register({ name, email, password }) {
  const data = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
  setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  return request("/api/auth/me");
}

export async function fetchUserData() {
  return request("/api/data");
}

export async function createFolder(name) {
  return request("/api/folders", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(id) {
  return request(`/api/folders/${id}`, { method: "DELETE" });
}

export async function uploadFile(file, folderId = null) {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", folderId);
  return request("/api/files/upload", { method: "POST", body: form });
}

export async function deleteFile(id) {
  return request(`/api/files/${id}`, { method: "DELETE" });
}

export async function moveFile(id, folderId) {
  return request(`/api/files/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ folderId }),
  });
}

export function logout() {
  setToken(null);
}
