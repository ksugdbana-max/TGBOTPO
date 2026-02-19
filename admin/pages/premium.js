import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

export default function PremiumPage() {
    const { selectedBot } = useBot();
    const [photoUrl, setPhotoUrl] = useState('');
    const [premiumText, setPremiumText] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedBot) return;
        setLoading(true);
        getAllConfig(selectedBot.bot_id).then((cfg) => {
            setPhotoUrl(cfg.premium_photo_url || '');
            setPremiumText(cfg.premium_text || '');
        }).finally(() => setLoading(false));
    }, [selectedBot]);

    const handleSave = async () => {
        if (!selectedBot) return;
        setSaving(true);
        try {
            await updateConfig(selectedBot.bot_id, 'premium_photo_url', photoUrl);
            await updateConfig(selectedBot.bot_id, 'premium_text', premiumText);
            toast.success('Premium section saved! ✅');
        } catch { toast.error('Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <Layout title="Premium Section" subtitle="Photo & caption shown when users tap Get Premium">
            {!selectedBot ? (
                <div className="card"><div className="card-desc">← Select a bot from the sidebar.</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-title">💎 Premium Photo</div>
                        <div className="card-desc">Shown when user taps Get Premium. Make it attractive!</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Photo URL or Telegram file_id</label>
                            <input type="text" className="form-input" value={photoUrl}
                                onChange={(e) => setPhotoUrl(e.target.value)} disabled={loading}
                                placeholder="https://example.com/premium.jpg" />
                        </div>
                        {photoUrl && <img src={photoUrl} alt="Premium preview" className="img-preview" onError={(e) => { e.target.style.display = 'none'; }} />}
                    </div>
                    <div className="card">
                        <div className="card-title">✍️ Premium Caption</div>
                        <div className="card-desc">Text shown below the premium photo. HTML supported.</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Caption Text</label>
                            <textarea className="form-textarea" value={premiumText}
                                onChange={(e) => setPremiumText(e.target.value)} disabled={loading}
                                placeholder="🌟 <b>Get Premium Access!</b>&#10;&#10;Choose your payment method below." />
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
                    </button>
                </>
            )}
        </Layout>
    );
}
