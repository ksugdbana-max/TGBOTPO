import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllPayments } from '../lib/api';
import { useBot } from '../context/BotContext';
import Link from 'next/link';

const BOT_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
    const { bots, selectedBot } = useBot();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllPayments().then(setPayments).finally(() => setLoading(false));
    }, []);

    const statsFor = (botId) => ({
        total: payments.filter(p => p.bot_id === botId).length,
        pending: payments.filter(p => p.bot_id === botId && p.status === 'pending').length,
        confirmed: payments.filter(p => p.bot_id === botId && p.status === 'confirmed').length,
    });

    return (
        <Layout title="Dashboard" subtitle="Overview of all your Telegram bots">

            {/* Global summary */}
            <div className="stats-grid" style={{ marginBottom: 28 }}>
                {[
                    { label: 'All Payments', count: payments.length, icon: '💳', cls: 'stat-icon-purple' },
                    { label: 'Pending', count: payments.filter(p => p.status === 'pending').length, icon: '⏳', cls: 'stat-icon-yellow' },
                    { label: 'Confirmed', count: payments.filter(p => p.status === 'confirmed').length, icon: '✅', cls: 'stat-icon-green' },
                    { label: 'Rejected', count: payments.filter(p => p.status === 'rejected').length, icon: '❌', cls: 'stat-icon-red' },
                ].map(s => (
                    <div className="stat-card" key={s.label}>
                        <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                        <div><div className="stat-value">{loading ? '—' : s.count}</div><div className="stat-label">{s.label}</div></div>
                    </div>
                ))}
            </div>

            {/* Per-bot summary cards */}
            <div className="card-title" style={{ marginBottom: 12, fontSize: 16 }}>🤖 Your Bots</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
                {bots.map((bot, idx) => {
                    const s = statsFor(bot.bot_id);
                    const color = BOT_COLORS[idx % BOT_COLORS.length];
                    return (
                        <div key={bot.bot_id} className="card" style={{ padding: 20, borderColor: `${color}44`, marginBottom: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${BOT_COLORS[(idx + 1) % BOT_COLORS.length]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: 'white', fontWeight: 800, boxShadow: `0 0 20px ${color}55` }}>
                                    {(bot.display_name || bot.first_name || 'B')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>{bot.display_name || bot.first_name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{bot.username} · {bot.bot_id}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13, textAlign: 'center' }}>
                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 0' }}>
                                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>{loading ? '—' : s.total}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Total</div>
                                </div>
                                <div style={{ background: 'var(--warning-light)', borderRadius: 8, padding: '8px 0' }}>
                                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--warning)' }}>{loading ? '—' : s.pending}</div>
                                    <div style={{ color: 'var(--warning)', fontSize: 11 }}>Pending</div>
                                </div>
                                <div style={{ background: 'var(--success-light)', borderRadius: 8, padding: '8px 0' }}>
                                    <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--success)' }}>{loading ? '—' : s.confirmed}</div>
                                    <div style={{ color: 'var(--success)', fontSize: 11 }}>Done</div>
                                </div>
                            </div>
                            <Link href="/users">
                                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
                                    View Payments →
                                </button>
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Quick config links */}
            <div className="card-title" style={{ marginBottom: 12, fontSize: 16 }}>⚡ Quick Configure</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {[
                    { href: '/welcome', icon: '👋', label: 'Welcome' },
                    { href: '/buttons', icon: '🔗', label: 'Button Links' },
                    { href: '/premium', icon: '💎', label: 'Premium' },
                    { href: '/upi', icon: '💳', label: 'UPI Payment' },
                    { href: '/crypto', icon: '₿', label: 'Crypto' },
                    { href: '/confirmation', icon: '✉️', label: 'Confirm Msg' },
                ].map((item) => (
                    <Link href={item.href} key={item.href}>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            <div style={{ fontSize: 26, marginBottom: 8 }}>{item.icon}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                            {selectedBot && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>@{selectedBot.username}</div>}
                        </div>
                    </Link>
                ))}
            </div>
        </Layout>
    );
}
