import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useBot } from '../context/BotContext';
import { updateConfig, getAllConfig } from '../lib/api';
import toast from 'react-hot-toast';

const navSections = [
    {
        section: 'Overview', items: [
            { href: '/', icon: '🏠', label: 'Dashboard' },
            { href: '/users', icon: '👥', label: 'All Payments' },
        ]
    },
    {
        section: 'Bot Config', items: [
            { href: '/welcome', icon: '👋', label: 'Welcome Message' },
            { href: '/buttons', icon: '🔗', label: 'Button Links' },
            { href: '/premium', icon: '💎', label: 'Premium Section' },
            { href: '/upi', icon: '💳', label: 'UPI Payment' },
            { href: '/crypto', icon: '₿', label: 'Crypto Payment' },
            { href: '/confirmation', icon: '✉️', label: 'Confirm Message' },
        ]
    },
];

const BOT_COLORS = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function Layout({ children, title, subtitle }) {
    const router = useRouter();
    const { bots, selectedBot, switchBot, botsLoading } = useBot();
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [savingName, setSavingName] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token && router.pathname !== '/login') router.push('/login');
    }, [router]);

    useEffect(() => {
        if (selectedBot) setNameInput(selectedBot.display_name || selectedBot.first_name || '');
    }, [selectedBot]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('selected_bot');
        router.push('/login');
    };

    const handleSaveName = async () => {
        if (!selectedBot) return;
        setSavingName(true);
        try {
            await updateConfig(selectedBot.bot_id, 'bot_display_name', nameInput);
            toast.success('Bot name saved!');
            setEditingName(false);
        } catch {
            toast.error('Failed to save name.');
        } finally {
            setSavingName(false);
        }
    };

    const getBotColor = (idx) => BOT_COLORS[idx % BOT_COLORS.length];

    return (
        <div className="layout">
            <aside className="sidebar">
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🤖</div>
                    <div>
                        <div className="sidebar-logo-text">Bot Admin</div>
                        <div className="sidebar-logo-sub">Unified Panel</div>
                    </div>
                </div>

                {/* Bot Switcher */}
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border)' }}>
                    <div className="sidebar-section-label" style={{ marginBottom: 8 }}>Switch Bot</div>
                    {botsLoading ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 4px' }}>Loading bots...</div>
                    ) : bots.length === 0 ? (
                        <div style={{ color: 'var(--danger)', fontSize: 12, padding: '8px 4px' }}>⚠️ No bots configured</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {bots.map((bot, idx) => (
                                <div
                                    key={bot.bot_id}
                                    onClick={() => switchBot(bot)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 10,
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        border: `1px solid ${selectedBot?.bot_id === bot.bot_id ? getBotColor(idx) : 'transparent'}`,
                                        background: selectedBot?.bot_id === bot.bot_id ? `${getBotColor(idx)}22` : 'transparent',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${getBotColor(idx)}, ${getBotColor(idx + 1)})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                                    }}>
                                        {(bot.display_name || bot.first_name || 'B')[0].toUpperCase()}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {bot.display_name || bot.first_name}
                                        </div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{bot.username}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Active bot name editor */}
                {selectedBot && (
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-primary)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            Active: @{selectedBot.username}
                        </div>
                        {editingName ? (
                            <div style={{ display: 'flex', gap: 4 }}>
                                <input
                                    className="form-input"
                                    style={{ fontSize: 12, padding: '5px 8px' }}
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    placeholder="Display name..."
                                />
                                <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={savingName}>✓</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(false)}>✕</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {selectedBot.display_name || selectedBot.first_name}
                                </span>
                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingName(true)} style={{ padding: '3px 8px', fontSize: 11 }}>
                                    ✏️ Rename
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Nav */}
                <nav className="sidebar-nav">
                    {navSections.map((section) => (
                        <div key={section.section}>
                            <div className="sidebar-section-label">{section.section}</div>
                            {section.items.map((item) => (
                                <Link href={item.href} key={item.href}>
                                    <div className={`nav-item ${router.pathname === item.href ? 'active' : ''}`}>
                                        <span className="nav-item-icon">{item.icon}</span>
                                        {item.label}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="main">
                <div className="topbar">
                    <div>
                        <div className="topbar-title">
                            {selectedBot && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    fontSize: 12, fontWeight: 600, color: 'var(--accent)',
                                    background: 'var(--accent-light)',
                                    padding: '2px 8px', borderRadius: 100,
                                    marginRight: 10,
                                }}>
                                    🤖 @{selectedBot.username}
                                </span>
                            )}
                            {title}
                        </div>
                        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
                    </div>
                </div>

                {/* No bot warning */}
                {!botsLoading && !selectedBot && router.pathname !== '/login' && (
                    <div style={{ margin: '24px 32px', padding: '16px', background: 'var(--warning-light)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', color: 'var(--warning)', fontSize: 14 }}>
                        ⚠️ No bots are configured. Add <code>BOT_TOKEN_1</code> and <code>BOT_ID_1</code> to your API environment variables.
                    </div>
                )}

                <div className="page-content">{children}</div>
            </main>
        </div>
    );
}
