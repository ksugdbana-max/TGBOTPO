import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function PremiumPage() {
    const [photoUrl, setPhotoUrl] = useState('');
    const [premiumText, setPremiumText] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setPhotoUrl(cfg.premium_photo_url || '');
            setPremiumText(cfg.premium_text || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('premium_photo_url', photoUrl);
            await updateConfig('premium_text', premiumText);
            toast.success('Premium section saved! ✅');
        } catch {
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Premium Section" subtitle="Configure the photo and text shown when users tap Get Premium">
            <div className="card">
                <div className="card-title">💎 Premium Photo</div>
                <div className="card-desc">This photo is shown when users tap the "Get Premium" button. Make it attractive!</div>
                <div className="form-group">
                    <label className="form-label">Photo URL or Telegram file_id</label>
                    <input
                        type="text"
                        className="form-input"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="https://example.com/premium.jpg"
                        disabled={loading}
                    />
                </div>
                {photoUrl && (
                    <div>
                        <div className="form-label">Preview</div>
                        <img src={photoUrl} alt="Premium preview" className="img-preview" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">✍️ Premium Caption</div>
                <div className="card-desc">Text shown below the premium photo. Supports HTML formatting.</div>
                <div className="form-group">
                    <label className="form-label">Caption Text</label>
                    <textarea
                        className="form-textarea"
                        value={premiumText}
                        onChange={(e) => setPremiumText(e.target.value)}
                        placeholder="🌟 <b>Get Premium Access!</b>&#10;&#10;Choose your payment method below."
                        disabled={loading}
                    />
                </div>
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
            </button>
        </Layout>
    );
}
