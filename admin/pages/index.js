import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getPayments } from '../lib/api';

export default function Dashboard() {
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getPayments().then((payments) => {
            setStats({
                total: payments.length,
                pending: payments.filter(p => p.status === 'pending').length,
                confirmed: payments.filter(p => p.status === 'confirmed').length,
                rejected: payments.filter(p => p.status === 'rejected').length,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    return (
        <Layout title="Dashboard" subtitle="Overview of your bot activity">
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon stat-icon-purple">💳</div>
                    <div>
                        <div className="stat-value">{loading ? '—' : stats.total}</div>
                        <div className="stat-label">Total Payments</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-yellow">⏳</div>
                    <div>
                        <div className="stat-value">{loading ? '—' : stats.pending}</div>
                        <div className="stat-label">Pending Review</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-green">✅</div>
                    <div>
                        <div className="stat-value">{loading ? '—' : stats.confirmed}</div>
                        <div className="stat-label">Confirmed</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon stat-icon-red">❌</div>
                    <div>
                        <div className="stat-value">{loading ? '—' : stats.rejected}</div>
                        <div className="stat-label">Rejected</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-title">🚀 Quick Links</div>
                <div className="card-desc">Jump to any section to manage your bot content.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {[
                        { href: '/welcome', icon: '👋', label: 'Welcome Message', desc: 'Edit text & photo' },
                        { href: '/buttons', icon: '🔗', label: 'Button Links', desc: 'Demo & How To Use URLs' },
                        { href: '/premium', icon: '💎', label: 'Premium Section', desc: 'Change premium photo' },
                        { href: '/upi', icon: '💳', label: 'UPI Payment', desc: 'QR code & message' },
                        { href: '/crypto', icon: '₿', label: 'Crypto Payment', desc: 'QR code & message' },
                        { href: '/users', icon: '👥', label: 'Users & Payments', desc: 'Confirm or reject' },
                    ].map((item) => (
                        <a href={item.href} key={item.href} style={{ textDecoration: 'none' }}>
                            <div style={{
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
