import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers['x-api-key'] = token;
        }
    }
    return config;
});

export async function login(password) {
    const res = await api.post('/auth/login', { password });
    return res.data.token;
}

export async function getAllConfig() {
    const res = await api.get('/config');
    return res.data;
}

export async function getConfig(key) {
    const res = await api.get(`/config/${key}`);
    return res.data.value;
}

export async function updateConfig(key, value) {
    await api.put(`/config/${key}`, { value });
}

export async function getPayments() {
    const res = await api.get('/payments');
    return res.data;
}

export async function updatePayment(id, status) {
    const res = await api.patch(`/payments/${id}`, { status });
    return res.data;
}
