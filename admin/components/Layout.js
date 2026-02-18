import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const navItems = [
    {
        section: 'Content', items: [
            { href: '/', icon: '🏠', label: 'Dashboard' },
            { href: '/welcome', icon: '👋', label: 'Welcome Message' },
            { href: '/buttons', icon: '🔗', label: 'Button Links' },
            { href: '/premium', icon: '💎', label: 'Premium Section' },
        ]
    },
    {
        section: 'Payments', items: [
            { href: '/upi', icon: '💳', label: 'UPI Payment' },
            { href: '/crypto', icon: '₿', label: 'Crypto Payment' },
            { href: '/confirmation', icon: '✉️', label: 'Confirmation Msg' },
        ]
    },
    {
        section: 'Management', items: [
            { href: '/users', icon: '👥', label: 'Users & Payments' },
        ]
    },
];

export default function Layout({ children, title, subtitle }) {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token && router.pathname !== '/login') {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/login');
    };

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🤖</div>
                    <div>
                        <div className="sidebar-logo-text">Bot Admin</div>
                        <div className="sidebar-logo-sub">Control Panel</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {navItems.map((section) => (
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
                        <div className="topbar-title">{title}</div>
                        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
                    </div>
                    <div className="topbar-actions">
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Admin Panel v1.0</span>
                    </div>
                </div>
                <div className="page-content">{children}</div>
            </main>
        </div>
    );
}
