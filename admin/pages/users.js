import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllPayments, updatePayment, getTelegramFileUrl } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

const BOT_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function UsersPage() {
    const { bots } = useBot();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [screenshot, setScreenshot] = useState(null); // { url, loading }
    const [botFilter, setBotFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchPayments = () => {
        setLoading(true);
        getAllPayments().then(setPayments).finally(() => setLoading(false));
    };

    useEffect(() => { fetchPayments(); }, []);

    const handleAction = async (id, status) => {
        setActionLoading((p) => ({ ...p, [id]: status }));
        try {
            await updatePayment(id, status);
            toast.success(status === 'confirmed' ? '✅ Confirmed! User notified.' : '❌ Rejected. User notified.');
            setPayments((p) => p.map((pay) => pay.id === id ? { ...pay, status } : pay));
        } catch { toast.error('Action failed.'); }
        finally { setActionLoading((p) => ({ ...p, [id]: null })); }
    };

    const viewScreenshot = async (botId, fileId) => {
        setScreenshot({ url: null, loading: true });
        try {
            const url = await getTelegramFileUrl(botId, fileId);
            setScreenshot({ url, loading: false });
        } catch {
            toast.error('Could not load screenshot.');
            setScreenshot(null);
        }
    };

    const getBotColor = (botId) => {
        const idx = bots.findIndex(b => b.bot_id === botId);
        return BOT_COLORS[idx >= 0 ? idx % BOT_COLORS.length : 0];
    };

    const getBotLabel = (botId) => {
        const bot = bots.find(b => b.bot_id === botId);
        return bot ? (bot.display_name || bot.first_name || botId) : botId;
    };

    const filtered = payments.filter(p => {
        if (botFilter !== 'all' && p.bot_id !== botFilter) return false;
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        return true;
    });

    const stats = (botId) => ({
        total: payments.filter(p => botId === 'all' ? true : p.bot_id === botId).length,
        pending: payments.filter(p => (botId === 'all' ? true : p.bot_id === botId) && p.status === 'pending').length,
        confirmed: payments.filter(p => (botId === 'all' ? true : p.bot_id === botId) && p.status === 'confirmed').length,
        rejected: payments.filter(p => (botId === 'all' ? true : p.bot_id === botId) && p.status === 'rejected').length,
    });

    const allStats = stats('all');
    const formatDate = (iso) => iso ? new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

    return (
        <Layout title="All Payments" subtitle="Payments from all bots — filter by bot or status">

            {/* Screenshot Modal */}
            {screenshot && (
                <div className="modal-overlay" onClick={() => setScreenshot(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ fontWeight: 600 }}>💸 Payment Screenshot</div>
                            <button className="btn btn-ghost btn-sm" onClick={() => setScreenshot(null)}>✕ Close</button>
                        </div>
                        {screenshot.loading ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <span className="spinner" style={{ width: 28, height: 28, display: 'inline-block' }} />
                                <div style={{ marginTop: 12 }}>Loading screenshot...</div>
                            </div>
                        ) : screenshot.url ? (
                            <img
                                src={screenshot.url}
                                alt="Payment screenshot"
                                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 10 }}
                            />
                        ) : (
                            <div style={{ color: 'var(--danger)', textAlign: 'center', padding: 20 }}>
                                ❌ Failed to load image
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Global stats */}
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total', count: allStats.total, icon: '💳', cls: 'stat-icon-purple' },
                    { label: 'Pending', count: allStats.pending, icon: '⏳', cls: 'stat-icon-yellow' },
                    { label: 'Confirmed', count: allStats.confirmed, icon: '✅', cls: 'stat-icon-green' },
                    { label: 'Rejected', count: allStats.rejected, icon: '❌', cls: 'stat-icon-red' },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div><div className="stat-value">{s.count}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Per-bot mini stats */}
            {bots.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {bots.map((bot, idx) => {
                        const s = stats(bot.bot_id);
                        const color = BOT_COLORS[idx % BOT_COLORS.length];
                        return (
                            <div key={bot.bot_id} className="card" style={{ padding: 16, borderColor: `${color}55`, cursor: 'pointer', marginBottom: 0 }}
                                onClick={() => setBotFilter(botFilter === bot.bot_id ? 'all' : bot.bot_id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${BOT_COLORS[(idx + 1) % BOT_COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 700 }}>
                                        {(bot.display_name || bot.first_name || 'B')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{bot.display_name || bot.first_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{bot.username}</div>
                                    </div>
                                    {botFilter === bot.bot_id && <span style={{ marginLeft: 'auto', fontSize: 11, background: `${color}33`, color, padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>Filtered</span>}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 12, textAlign: 'center' }}>
                                    <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: 6, padding: '4px 0' }}><div style={{ fontWeight: 700 }}>{s.pending}</div>Pending</div>
                                    <div style={{ background: 'var(--success-light)', color: 'var(--success)', borderRadius: 6, padding: '4px 0' }}><div style={{ fontWeight: 700 }}>{s.confirmed}</div>Done</div>
                                    <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', borderRadius: 6, padding: '4px 0' }}><div style={{ fontWeight: 700 }}>{s.rejected}</div>Rejected</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Filters + Refresh */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['all', 'pending', 'confirmed', 'rejected'].map(f => (
                        <button key={f} className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(f)}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${botFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setBotFilter('all')}>All Bots</button>
                    {bots.map((bot, idx) => (
                        <button key={bot.bot_id}
                            className={`btn btn-sm ${botFilter === bot.bot_id ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setBotFilter(botFilter === bot.bot_id ? 'all' : bot.bot_id)}
                            style={botFilter === bot.bot_id ? { background: BOT_COLORS[idx % BOT_COLORS.length] } : {}}>
                            {bot.display_name || bot.first_name}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={fetchPayments} style={{ marginLeft: 'auto' }}>🔄 Refresh</button>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Bot</th>
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
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No payments found.</td></tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: `${getBotColor(p.bot_id)}22`, color: getBotColor(p.bot_id) }}>
                                        🤖 {getBotLabel(p.bot_id)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.username || 'Unknown'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {p.user_id}</div>
                                </td>
                                <td><span style={{ fontWeight: 600 }}>{p.payment_type === 'upi' ? '💳 UPI' : '₿ Crypto'}</span></td>
                                <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                                <td>
                                    {p.screenshot_file_id ? (
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => viewScreenshot(p.bot_id, p.screenshot_file_id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                                        >
                                            🖼️ View
                                        </button>
                                    ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                                </td>
                                <td style={{ fontSize: 12 }}>{formatDate(p.created_at)}</td>
                                <td>
                                    {p.status === 'pending' ? (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-success btn-sm" onClick={() => handleAction(p.id, 'confirmed')} disabled={!!actionLoading[p.id]}>
                                                {actionLoading[p.id] === 'confirmed' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✅'}
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleAction(p.id, 'rejected')} disabled={!!actionLoading[p.id]}>
                                                {actionLoading[p.id] === 'rejected' ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '❌'}
                                            </button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.status === 'confirmed' ? '✅ Done' : '❌ Done'}</span>
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
