import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('admin_token');
        if (token) config.headers['x-api-key'] = token;
    }
    return config;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function login(password) {
    const res = await api.post('/auth/login', { password });
    return res.data.token;
}

// ── Bots ──────────────────────────────────────────────────────────────────────
export async function getBots() {
    const res = await api.get('/bots');
    return res.data;
}

// ── Config (per bot) ──────────────────────────────────────────────────────────
export async function getAllConfig(botId) {
    const res = await api.get(`/bots/${botId}/config`);
    return res.data;
}

export async function updateConfig(botId, key, value) {
    await api.put(`/bots/${botId}/config/${key}`, { value });
}

// ── Payments ──────────────────────────────────────────────────────────────────
export async function getAllPayments() {
    const res = await api.get('/payments');
    return res.data;
}

export async function getBotPayments(botId) {
    const res = await api.get(`/bots/${botId}/payments`);
    return res.data;
}

export async function updatePayment(id, status) {
    const res = await api.patch(`/payments/${id}`, { status });
    return res.data;
}

// ── Image Upload ───────────────────────────────────────────────────────────────
export async function uploadImage(botId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/bots/${botId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
}
