import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function ButtonsPage() {
    const [demoUrl, setDemoUrl] = useState('');
    const [howToUrl, setHowToUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setDemoUrl(cfg.demo_button_url || '');
            setHowToUrl(cfg.how_to_use_button_url || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('demo_button_url', demoUrl);
            await updateConfig('how_to_use_button_url', howToUrl);
            toast.success('Button links saved! ✅');
        } catch {
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Button Links" subtitle="Configure the URLs for the Demo and How To Use buttons">
            <div className="card">
                <div className="card-title">🎥 Premium Demo Button</div>
                <div className="card-desc">The URL that opens when users tap the "Premium Demo ↗" button. Can be a Telegram channel, YouTube video, etc.</div>
                <div className="form-group">
                    <label className="form-label">Demo URL</label>
                    <input
                        type="url"
                        className="form-input"
                        value={demoUrl}
                        onChange={(e) => setDemoUrl(e.target.value)}
                        placeholder="https://t.me/yourchannel or https://youtube.com/..."
                        disabled={loading}
                    />
                </div>
                {demoUrl && (
                    <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                        ✅ Link set: <a href={demoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{demoUrl}</a>
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">✅ How To Get Premium Button</div>
                <div className="card-desc">The URL that opens when users tap the "How To Get Premium? ↗" button.</div>
                <div className="form-group">
                    <label className="form-label">How To Use URL</label>
                    <input
                        type="url"
                        className="form-input"
                        value={howToUrl}
                        onChange={(e) => setHowToUrl(e.target.value)}
                        placeholder="https://t.me/yourchannel or https://..."
                        disabled={loading}
                    />
                </div>
                {howToUrl && (
                    <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                        ✅ Link set: <a href={howToUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{howToUrl}</a>
                    </div>
                )}
            </div>

            <div className="card" style={{ background: 'var(--accent-light)', borderColor: 'rgba(124,58,237,0.3)' }}>
                <div className="card-title">📱 Button Preview</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {['💎 Get Premium', '🎥 Premium Demo ↗', '✅ How To Get Premium? ↗'].map(label => (
                        <div key={label} style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '10px 16px',
                            fontSize: 14,
                            color: 'var(--text-primary)',
                            textAlign: 'center',
                        }}>{label}</div>
                    ))}
                </div>
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
            </button>
        </Layout>
    );
}
