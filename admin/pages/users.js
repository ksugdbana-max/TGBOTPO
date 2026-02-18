import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getPayments, updatePayment } from '../lib/api';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [selectedScreenshot, setSelectedScreenshot] = useState(null);
    const [filter, setFilter] = useState('all');

    const fetchPayments = () => {
        setLoading(true);
        getPayments().then((data) => {
            setPayments(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => { fetchPayments(); }, []);

    const handleAction = async (id, status) => {
        setActionLoading((prev) => ({ ...prev, [id]: status }));
        try {
            await updatePayment(id, status);
            toast.success(status === 'confirmed' ? '✅ Payment confirmed! User notified.' : '❌ Payment rejected. User notified.');
            setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
        } catch {
            toast.error('Action failed. Try again.');
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: null }));
        }
    };

    const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

    const formatDate = (iso) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <Layout title="Users & Payments" subtitle="Review payment screenshots and confirm or reject them">
            {/* Screenshot Modal */}
            {selectedScreenshot && (
                <div className="modal-overlay" onClick={() => setSelectedScreenshot(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontWeight: 600 }}>Payment Screenshot</div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedScreenshot(null)}>✕ Close</button>
                        </div>
                        <img
                            src={`https://api.telegram.org/file/bot${process.env.NEXT_PUBLIC_BOT_TOKEN}/${selectedScreenshot}`}
                            alt="Screenshot"
                            className="modal-img"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                        <div style={{ display: 'none', color: 'var(--text-muted)', fontSize: 13, padding: 16 }}>
                            ⚠️ Cannot preview directly. File ID: <code>{selectedScreenshot}</code><br />
                            <small>To view, use the Telegram Bot API with your bot token.</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total', count: payments.length, icon: '💳', cls: 'stat-icon-purple' },
                    { label: 'Pending', count: payments.filter(p => p.status === 'pending').length, icon: '⏳', cls: 'stat-icon-yellow' },
                    { label: 'Confirmed', count: payments.filter(p => p.status === 'confirmed').length, icon: '✅', cls: 'stat-icon-green' },
                    { label: 'Rejected', count: payments.filter(p => p.status === 'rejected').length, icon: '❌', cls: 'stat-icon-red' },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div>
                            <div className="stat-value">{s.count}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter + Refresh */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                {['all', 'pending', 'confirmed', 'rejected'].map((f) => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={fetchPayments} style={{ marginLeft: 'auto' }}>
                    🔄 Refresh
                </button>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Screenshot</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No payments found.</td></tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {p.username || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {p.user_id}</div>
                                </td>
                                <td>
                                    <span style={{ fontWeight: 600 }}>
                                        {p.payment_type === 'upi' ? '💳 UPI' : '₿ Crypto'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                                </td>
                                <td>
                                    {p.screenshot_file_id ? (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setSelectedScreenshot(p.screenshot_file_id)}
                                        >
                                            🖼️ View
                                        </button>
                                    ) : '—'}
                                </td>
                                <td style={{ fontSize: 12 }}>{formatDate(p.created_at)}</td>
                                <td>
                                    {p.status === 'pending' ? (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => handleAction(p.id, 'confirmed')}
                                                disabled={!!actionLoading[p.id]}
                                            >
                                                {actionLoading[p.id] === 'confirmed' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✅ Confirm'}
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleAction(p.id, 'rejected')}
                                                disabled={!!actionLoading[p.id]}
                                            >
                                                {actionLoading[p.id] === 'rejected' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '❌ Reject'}
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {p.status === 'confirmed' ? '✅ Done' : '❌ Done'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
}
