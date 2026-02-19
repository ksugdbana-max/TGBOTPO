import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllConfig, updateConfig } from '../lib/api';
import { useBot } from '../context/BotContext';
import toast from 'react-hot-toast';

export default function ConfirmationPage() {
    const { selectedBot } = useBot();
    const [confirmMsg, setConfirmMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedBot) return;
        setLoading(true);
        getAllConfig(selectedBot.bot_id).then((cfg) => {
            setConfirmMsg(cfg.payment_confirmed_message || '');
        }).finally(() => setLoading(false));
    }, [selectedBot]);

    const handleSave = async () => {
        if (!selectedBot) return;
        setSaving(true);
        try {
            await updateConfig(selectedBot.bot_id, 'payment_confirmed_message', confirmMsg);
            toast.success('Confirmation message saved! ✅');
        } catch { toast.error('Failed to save.'); }
        finally { setSaving(false); }
    };

    return (
        <Layout title="Confirmation Message" subtitle="Message sent to users when their payment is approved">
            {!selectedBot ? (
                <div className="card"><div className="card-desc">← Select a bot from the sidebar.</div></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-title">✅ Payment Confirmed Message</div>
                        <div className="card-desc">Sent to the user when you confirm their payment. HTML supported.</div>
                        <div className="form-group" style={{ marginTop: 12 }}>
                            <label className="form-label">Confirmation Message</label>
                            <textarea className="form-textarea" style={{ minHeight: 160 }} value={confirmMsg}
                                onChange={(e) => setConfirmMsg(e.target.value)} disabled={loading}
                                placeholder="🎉 <b>Payment Confirmed!</b>&#10;&#10;Your premium access has been activated! 🌟" />
                        </div>
                    </div>
                    <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'var(--danger-light)' }}>
                        <div className="card-title">❌ Payment Rejected Message (Fixed)</div>
                        <div className="card-desc">Auto-sent on rejection. Cannot be changed.</div>
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {`❌ Payment Rejected\n\nUnfortunately, we could not verify your payment screenshot.\nPlease send a clear screenshot of the successful transaction.\nIf you believe this is a mistake, contact support.\nTry again with /start. 🙏`}
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
