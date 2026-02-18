import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function CryptoPage() {
    const [qrUrl, setQrUrl] = useState('');
    const [message, setMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setQrUrl(cfg.crypto_qr_url || '');
            setMessage(cfg.crypto_message || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('crypto_qr_url', qrUrl);
            await updateConfig('crypto_message', message);
            toast.success('Crypto section saved! ✅');
        } catch {
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout title="Crypto Payment" subtitle="Configure the Crypto QR code and payment instructions">
            <div className="card">
                <div className="card-title">₿ Crypto QR Code</div>
                <div className="card-desc">Enter the URL of your crypto wallet QR code image. This will be shown when users tap "PAY VIA CRYPTO".</div>
                <div className="form-group">
                    <label className="form-label">QR Code Image URL</label>
                    <input
                        type="text"
                        className="form-input"
                        value={qrUrl}
                        onChange={(e) => setQrUrl(e.target.value)}
                        placeholder="https://example.com/crypto-qr.jpg"
                        disabled={loading}
                    />
                </div>
                {qrUrl && (
                    <div>
                        <div className="form-label">Preview</div>
                        <img src={qrUrl} alt="Crypto QR" className="img-preview" style={{ maxWidth: 200 }} onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                )}
            </div>

            <div className="card">
                <div className="card-title">📝 Crypto Payment Instructions</div>
                <div className="card-desc">Message shown alongside the QR code. Include wallet address, network, amount. HTML supported.</div>
                <div className="form-group">
                    <label className="form-label">Payment Message</label>
                    <textarea
                        className="form-textarea"
                        style={{ minHeight: 160 }}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="₿ <b>Pay via Crypto</b>&#10;&#10;Network: TRC20 / USDT&#10;Wallet: 0xYOUR_WALLET_ADDRESS&#10;Amount: $XX USDT&#10;&#10;After payment, tap the button below."
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
