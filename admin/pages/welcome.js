import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

export default function WelcomePage() {
    const { selectedBot } = useBot();
    const [text, setText] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedBot) return;
        setLoading(true);
        getAllConfig(selectedBot.bot_id).then((cfg) => {
            setText(cfg.welcome_text || '');
            setMediaUrl(cfg.welcome_media_url || '');
        }).finally(() => setLoading(false));
    }, [selectedBot]);

    const handleSave = async () => {
        if (!selectedBot) return;
        setSaving(true);
        try {
            await updateConfig(selectedBot.bot_id, 'welcome_text', text);
            await updateConfig(selectedBot.bot_id, 'welcome_media_url', mediaUrl);
            toast.success('Welcome message saved! ✅');
        } catch { toast.error('Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <Layout title="Welcome Message" subtitle="First message users see when they tap /start">
            {!selectedBot ? (
                <div className="card"><div className="card-desc">← Select a bot from the sidebar to configure.</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-title">👋 Welcome Text</div>
                        <div className="card-desc">Caption shown with the welcome photo. HTML supported.</div>
                        <div className="form-group">
                            <label className="form-label">Message Text</label>
                            <textarea className="form-textarea" style={{ minHeight: 140 }} value={text}
                                onChange={(e) => setText(e.target.value)} disabled={loading}
                                placeholder="👋 Welcome! Choose an option below." />
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-title">🖼️ Welcome Photo</div>
                        <div className="card-desc">Direct image URL or Telegram file_id shown with the welcome message.</div>
                        <div className="form-group">
                            <label className="form-label">Image URL or file_id</label>
                            <input type="text" className="form-input" value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)} disabled={loading}
                                placeholder="https://example.com/image.jpg" />
                        </div>
                        {mediaUrl && <img src={mediaUrl} alt="Preview" className="img-preview" onError={(e) => { e.target.style.display = 'none'; }} />}
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
                    </button>
                </>
            )}
        </Layout>
    );
}
