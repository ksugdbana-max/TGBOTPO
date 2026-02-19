import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

export default function UpiPage() {
    const { selectedBot } = useBot();
    const [qrUrl, setQrUrl] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedBot) return;
        setLoading(true);
        getAllConfig(selectedBot.bot_id).then((cfg) => {
            setQrUrl(cfg.upi_qr_url || '');
            setMessage(cfg.upi_message || '');
        }).finally(() => setLoading(false));
    }, [selectedBot]);

    const handleSave = async () => {
        if (!selectedBot) return;
        setSaving(true);
        try {
            await updateConfig(selectedBot.bot_id, 'upi_qr_url', qrUrl);
            await updateConfig(selectedBot.bot_id, 'upi_message', message);
            toast.success('UPI section saved! ✅');
        } catch { toast.error('Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <Layout title="UPI Payment" subtitle="QR code and instructions shown when user taps PAY VIA UPI">
            {!selectedBot ? (
                <div className="card"><div className="card-desc">← Select a bot from the sidebar.</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-title">💳 UPI QR Code</div>
                        <div className="card-desc">Each bot can have a completely different UPI QR code.</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">QR Code Image URL</label>
                            <input type="text" className="form-input" value={qrUrl}
                                onChange={(e) => setQrUrl(e.target.value)} disabled={loading}
                                placeholder="https://example.com/upi-qr.jpg" />
                        </div>
                        {qrUrl && <img src={qrUrl} alt="UPI QR" className="img-preview" style={{ maxWidth: 200 }} onError={(e) => { e.target.style.display = 'none'; }} />}
                    </div>
                    <div className="card">
                        <div className="card-title">📝 UPI Payment Instructions</div>
                        <div className="card-desc">Include UPI ID, amount, any instructions. HTML supported.</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Payment Message</label>
                            <textarea className="form-textarea" style={{ minHeight: 140 }} value={message}
                                onChange={(e) => setMessage(e.target.value)} disabled={loading}
                                placeholder="💳 <b>Pay via UPI</b>&#10;&#10;UPI ID: yourname@upi&#10;Amount: ₹XXX" />
                        </div>
                    </div>
                    <div className="card" style={{ background: 'var(--accent-light)', borderColor: 'rgba(124,58,237,0.3)' }}>
                        <div className="card-title">📱 Button Preview</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                            {[{ label: '✅ I HAVE PAID', bold: true }, { label: '⬅️ BACK', bold: false }].map(b => (
                                <div key={b.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 16px', fontSize: 14, fontWeight: b.bold ? 700 : 400, color: 'var(--text-primary)', textAlign: 'center' }}>{b.label}</div>
                            ))}
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
