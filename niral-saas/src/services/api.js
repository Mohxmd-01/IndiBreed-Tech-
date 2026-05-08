/**
 * api.js — Axios instance for NiralFarm backend
 * Base URL: http://localhost:4000/api
 * Attaches JWT Bearer token from localStorage on every request.
 * Auto-logout on 401 (expired/invalid token).
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
// NOTE: Skip auth token for login/register — these are public endpoints.
// Sending an old token here causes the backend to see an already-authenticated
// user and can return stale session data instead of creating a new account.
const PUBLIC_ROUTES = ['/auth/login', '/auth/register'];

api.interceptors.request.use(
  (config) => {
    const isPublic = PUBLIC_ROUTES.some(route => config.url?.includes(route));
    if (!isPublic) {
      const token = localStorage.getItem('niralFarm_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('niralFarm_token');
      localStorage.removeItem('niralFarm_auth');
      if (typeof window.logoutApp === 'function') window.logoutApp();
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe:    ()     => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ── Cattle ────────────────────────────────────────────────────────────────────
export const cattleAPI = {
  list:   ()      => api.get('/cattle'),
  create: (data)  => api.post('/cattle', data),
  update: (id, d) => api.put(`/cattle/${id}`, d),
  remove: (id)    => api.delete(`/cattle/${id}`),
};

// ── Milk ──────────────────────────────────────────────────────────────────────
export const milkAPI = {
  list:   (params) => api.get('/milk', { params }),
  create: (data)   => api.post('/milk', data),
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsAPI = {
  list:    ()   => api.get('/alerts'),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
};

// ── Devices ───────────────────────────────────────────────────────────────────
export const devicesAPI = {
  list:      ()     => api.get('/devices'),
  telemetry: (data) => api.post('/devices/telemetry', data),
};

// ── Advisory ─────────────────────────────────────────────────────────────────
export const advisoryAPI = {
  get: (cowId) => api.get(`/advisory/${cowId}`),
};

// ── Finance ───────────────────────────────────────────────────────────────────
export const financeAPI = {
  summary:    ()     => api.get('/finance/summary'),
  addExpense: (data) => api.post('/finance/expense', data),
};

// ── Device Activation & Lifecycle (Phase 1) ───────────────────────────────────
export const deviceActivationAPI = {
  activate: (collarId, activationCode) =>
    api.post('/devices/activate', { collarId, activationCode }),
  transfer: (deviceId, newOwnerPhone) =>
    api.post('/devices/transfer', { deviceId, newOwnerPhone }),
  reset: (deviceId, reason) =>
    api.put(`/devices/${deviceId}/reset`, { reason }),
};

// ── Vet API (Phase 2) ──────────────────────────────────────────────────────────
export const vetAPI = {
  getFeed:         ()           => api.get('/vet/feed'),
  getProfile:      ()           => api.get('/vet/profile'),
  getFarmers:      ()           => api.get('/vet/farmers'),
  getFarmerDetail: (id)         => api.get(`/vet/farmers/${id}`),
  addTreatment:    (data)       => api.post('/vet/treatments', data),
  getTreatments:   (farmerId)   => farmerId ? api.get(`/vet/treatments/${farmerId}`) : api.get('/vet/treatments'),
  scheduleVisit:   (data)       => api.post('/vet/visits', data),
  getVisits:       ()           => api.get('/vet/visits'),
  completeVisit:   (id, notes)  => api.put(`/vet/visits/${id}/complete`, { notes }),
  cancelVisit:     (id)         => api.put(`/vet/visits/${id}/cancel`),
  requestLink:     (phone, msg) => api.post('/vet/link/request', { phone, message: msg }),
  respondToLink:   (id, accept) => api.put(`/vet/link/${id}`, { accept }),
  getLinks:        ()           => api.get('/vet/links'),
  getPendingLinks: ()           => api.get('/vet/links/pending'),
};

// ── Company API (Phase 3 — scaffold) ──────────────────────────────────────────
export const companyAPI = {
  getFarmers:        ()        => api.get('/company/farmers'),
  getMilkAnalytics:  (params)  => api.get('/company/analytics/milk', { params }),
  getHealthOverview: ()        => api.get('/company/analytics/health'),
  getRanking:        ()        => api.get('/company/analytics/ranking'),
  getRiskScores:     ()        => api.get('/company/analytics/risk'),
  onboardFarmer:     (phone)   => api.post('/company/link', { phone }),
  respondToInvite:   (id, acc) => api.put(`/company/link/${id}`, { accept: acc }),
};

// ── Subscription API (Phase 4 — scaffold) ─────────────────────────────────────
export const subscriptionAPI = {
  getPlans:  ()      => api.get('/subscription/plans'),
  getMyPlan: ()      => api.get('/subscription/me'),
  upgrade:   (plan)  => api.post('/subscription/upgrade', { plan }),
  cancel:    ()      => api.post('/subscription/cancel'),
};

export default api;
