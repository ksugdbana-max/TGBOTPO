import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import toast from 'react-hot-toast';

export default function ConfirmationPage() {
    const [confirmMsg, setConfirmMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllConfig().then((cfg) => {
            setConfirmMsg(cfg.payment_confirmed_message || '');
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateConfig('payment_confirmed_message', confirmMsg);
            toast.success('Confirmation message saved! ✅');
        } catch {
            toast.error('Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const defaultRejection = `❌ Payment Rejected\n\nUnfortunately, we could not verify your payment screenshot.\nPlease make sure you send a clear screenshot showing the successful transaction.\nIf you believe this is a mistake, please contact support.\nYou can try again by sending /start. 🙏`;

    return (
        <Layout title="Confirmation Message" subtitle="Set the message sent to users when their payment is confirmed">
            <div className="card">
                <div className="card-title">✅ Payment Confirmed Message</div>
                <div className="card-desc">
                    This message is sent to the user when you confirm their payment in the Users section. Supports HTML formatting.
                </div>
                <div className="form-group">
                    <label className="form-label">Confirmation Message</label>
                    <textarea
                        className="form-textarea"
                        style={{ minHeight: 160 }}
                        value={confirmMsg}
                        onChange={(e) => setConfirmMsg(e.target.value)}
                        placeholder="🎉 <b>Payment Confirmed!</b>&#10;&#10;Your premium access has been activated. Welcome! 🌟"
                        disabled={loading}
                    />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 Tip: Use <code style={{ background: 'var(--bg-secondary)', padding: '1px 4px', borderRadius: 4 }}>&lt;b&gt;bold&lt;/b&gt;</code> for formatting.
                </div>
            </div>

            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-light)' }}>
                <div className="card-title">❌ Payment Rejected Message (Fixed)</div>
                <div className="card-desc">This message is automatically sent when you reject a payment. It cannot be changed.</div>
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px',
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.7,
                }}>
                    {defaultRejection}
                </div>
            </div>

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Changes'}
            </button>
        </Layout>
    );
}
