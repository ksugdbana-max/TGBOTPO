import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function WelcomePage() {
    const [text, setText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setText(cfg.welcome_text || '');
            setMediaUrl(cfg.welcome_media_url || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('welcome_text', text);
            await updateConfig('welcome_media_url', mediaUrl);
            toast.success('Welcome message saved! ✅');
        } catch {
            toast.error('Failed to save. Check your connection.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Welcome Message" subtitle="Configure the first message users see when they start the bot">
            <div className="card">
                <div className="card-title">👋 Welcome Text</div>
                <div className="card-desc">This text appears as the caption of the welcome photo. Supports HTML formatting (bold, italic, etc.)</div>
                <div className="form-group">
                    <label className="form-label">Message Text (HTML supported)</label>
                    <textarea
                        className="form-textarea"
                        style={{ minHeight: 140 }}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="👋 Welcome to our bot! Choose an option below."
                        disabled={loading}
                    />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    💡 Tip: Use <code style={{ background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: 4 }}>&lt;b&gt;bold&lt;/b&gt;</code>, <code style={{ background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: 4 }}>&lt;i&gt;italic&lt;/i&gt;</code> for formatting.
                </div>
            </div>

            <div className="card">
                <div className="card-title">🖼️ Welcome Photo</div>
                <div className="card-desc">Enter a direct image URL or a Telegram file_id. This photo will be shown with the welcome message.</div>
                <div className="form-group">
                    <label className="form-label">Image URL or Telegram file_id</label>
                    <input
                        type="text"
                        className="form-input"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        disabled={loading}
                    />
                </div>
                {mediaUrl && (
                    <div>
                        <div className="form-label">Preview</div>
                        <img
                            src={mediaUrl}
                            alt="Welcome preview"
                            className="img-preview"
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                )}
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
            </button>
        </Layout>
    );
}
