import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

export default function ButtonsPage() {
    const { selectedBot } = useBot();
    const [demoUrl, setDemoUrl] = useState('');
    const [howToUrl, setHowToUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedBot) return;
        setLoading(true);
        getAllConfig(selectedBot.bot_id).then((cfg) => {
            setDemoUrl(cfg.demo_button_url || '');
            setHowToUrl(cfg.how_to_use_button_url || '');
        }).finally(() => setLoading(false));
    }, [selectedBot]);

    const handleSave = async () => {
        if (!selectedBot) return;
        setSaving(true);
        try {
            await updateConfig(selectedBot.bot_id, 'demo_button_url', demoUrl);
            await updateConfig(selectedBot.bot_id, 'how_to_use_button_url', howToUrl);
            toast.success('Button links saved! ✅');
        } catch { toast.error('Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <Layout title="Button Links" subtitle="URLs for the Demo and How To Use buttons">
            {!selectedBot ? (
                <div className="card"><div className="card-desc">← Select a bot from the sidebar.</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-title">🎥 Premium Demo Button URL</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">URL</label>
                            <input type="url" className="form-input" value={demoUrl}
                                onChange={(e) => setDemoUrl(e.target.value)} disabled={loading}
                                placeholder="https://t.me/channel or https://youtube.com/..." />
                        </div>
                        {demoUrl && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>✅ <a href={demoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{demoUrl}</a></div>}
                    </div>
                    <div className="card">
                        <div className="card-title">✅ How To Get Premium Button URL</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">URL</label>
                            <input type="url" className="form-input" value={howToUrl}
                                onChange={(e) => setHowToUrl(e.target.value)} disabled={loading}
                                placeholder="https://t.me/..." />
                        </div>
                        {howToUrl && <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>✅ <a href={howToUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{howToUrl}</a></div>}
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
                    </button>
                </>
            )}
        </Layout>
    );
}
