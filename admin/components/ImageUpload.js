import { useRef, useState } from 'react';
import { uploadImage } from '../lib/api';
import toast from 'react-hot-toast';

/**
 * ImageUpload — reusable component to upload an image from device
 * or paste a URL, with live preview.
 *
 * Props:
 *   botId     — the bot_id for upload scoping
 *   value     — current URL string
 *   onChange  — called with new URL string when changed
 *   label     — optional label (default: "Image")
 *   disabled  — disable inputs
 */
export default function ImageUpload({ botId, value, onChange, label = "Image", disabled }) {
    const fileRef = useRef();
    const [uploading, setUploading] = useState(false);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadImage(botId, file);
            onChange(url);
            toast.success('Image uploaded! ✅');
        } catch (err) {
            toast.error('Upload failed. Check Supabase Storage bucket.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>

            {/* URL input */}
            <input
                type="text"
                className="form-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || uploading}
                placeholder="https://example.com/image.jpg"
            />

            {/* Upload from device */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <button
                    type="button"
                    className="btn"
                    style={{ fontSize: 13, padding: '6px 14px', opacity: (disabled || uploading) ? 0.6 : 1 }}
                    onClick={() => fileRef.current?.click()}
                    disabled={disabled || uploading}
                >
                    {uploading ? '⏳ Uploading...' : '📁 Upload from Device'}
                </button>
                <span style={{ fontSize: 12, opacity: 0.5 }}>or paste a URL above</span>
            </div>
            <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
            />

            {/* Preview */}
            {value && (
                <img
                    src={value}
                    alt="Preview"
                    style={{
                        marginTop: 12,
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.1)',
                        objectFit: 'cover',
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                    onLoad={(e) => { e.target.style.display = 'block'; }}
                />
            )}
        </div>
    );
}
