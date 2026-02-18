import { useState } from 'react';
import { useRouter } from 'next/router';
import { login } from '../lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await login(password);
            localStorage.setItem('admin_token', token);
            toast.success('Welcome back, Admin! 👋');
            router.push('/');
        } catch (err) {
            toast.error('Invalid password. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">🤖</div>
                    <div className="login-title">Bot Admin Panel</div>
                    <div className="login-sub">Sign in to manage your Telegram bot</div>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Admin Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                        disabled={loading}
                    >
                        {loading ? <span className="spinner" /> : '🔐 Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
