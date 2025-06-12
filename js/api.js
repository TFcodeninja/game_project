// src/api.js

const API_BASE = "https://127.0.0.1:8080/api";

export async function register({ email, password, codename }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, codename }),
  });
  return res.json(); // { message: "Utilisateur créé" }
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (res.ok && data.token) {
    localStorage.setItem("jwt", data.token);
    return data;
  } else {
    throw new Error(data.error || "Login failed");
  }
}

export function getToken() {
  return localStorage.getItem("jwt");
}

export async function postScore({ value, kills }) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ value, kills }),
  });
  return res.json(); // { message: ..., id: ... }
}

export async function fetchScores() {
  const token = getToken();
  const res = await fetch(`${API_BASE}/scores`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json(); // array of scores
}
