import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function UpiPage() {
    const [qrUrl, setQrUrl] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setQrUrl(cfg.upi_qr_url || '');
            setMessage(cfg.upi_message || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('upi_qr_url', qrUrl);
            await updateConfig('upi_message', message);
            toast.success('UPI section saved! ✅');
        } catch {
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="UPI Payment" subtitle="Configure the UPI QR code and payment instructions">
            <div className="card">
                <div className="card-title">💳 UPI QR Code</div>
                <div className="card-desc">Enter the URL of your UPI QR code image. This will be shown when users tap "PAY VIA UPI".</div>
                <div className="form-group">
                    <label className="form-label">QR Code Image URL</label>
                    <input
                        type="text"
                        className="form-input"
                        value={qrUrl}
                        onChange={(e) => setQrUrl(e.target.value)}
                        placeholder="https://example.com/upi-qr.jpg"
                        disabled={loading}
                    />
                </div>
                {qrUrl && (
                    <div>
                        <div className="form-label">Preview</div>
                        <img src={qrUrl} alt="UPI QR" className="img-preview" style={{ maxWidth: 200 }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">📝 UPI Payment Instructions</div>
                <div className="card-desc">Message shown alongside the QR code. Include UPI ID, amount, and any instructions. HTML supported.</div>
                <div className="form-group">
                    <label className="form-label">Payment Message</label>
                    <textarea
                        className="form-textarea"
                        style={{ minHeight: 140 }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="💳 <b>Pay via UPI</b>&#10;&#10;UPI ID: yourname@upi&#10;Amount: ₹XXX&#10;&#10;After payment, tap the button below."
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="card" style={{ background: 'var(--accent-light)', borderColor: 'rgba(124,58,237,0.3)' }}>
                <div className="card-title">📱 Button Preview</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                    {['✅ I HAVE PAID', '⬅️ BACK'].map(label => (
                        <div key={label} style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: '10px 16px',
                            fontSize: 14,
                            fontWeight: label.includes('PAID') ? 700 : 400,
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
