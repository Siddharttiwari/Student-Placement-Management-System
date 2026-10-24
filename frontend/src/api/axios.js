
import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
  withCredentials: true,
});

function getCookie(name) {
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(value.join("="));
    }
  }

  return null;
}

export async function initializeCSRF() {
  await api.get("accounts/csrf/");

  const token = getCookie("csrftoken");

  if (!token) {
    throw new Error(
      "CSRF cookie missing. Check browser cookies and API hostname."
    );
  }

  return token;
}

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();

  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = getCookie("csrftoken");

    if (token) {
      config.headers.set("X-CSRFToken", token);
    }
  }

  return config;
});

export default api;
