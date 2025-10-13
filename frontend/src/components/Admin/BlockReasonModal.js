const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalStyle = {
  width: '640px', maxWidth: '92vw', background: '#fff', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};
const headerStyle = {
  padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const titleStyle = { margin: 0, fontSize: '18px', fontWeight: 700 };
const bodyStyle = { padding: '16px 20px' };
const footerStyle = { padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '10px' };

const btn = (variant) => ({
  padding: '10px 14px', borderRadius: 8, border: '1px solid transparent', cursor: 'pointer',
  ...(variant === 'secondary' ? { background: '#f1f5f9', color: '#0f172a', borderColor: '#e2e8f0' } : {}),
  ...(variant === 'primary' ? { background: '#4f46e5', color: '#fff' } : {}),
});

const textareaStyle = {
  width: '100%', minHeight: '160px', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', outline: 'none', resize: 'vertical',
  fontSize: '14px', lineHeight: 1.5
};

export default function BlockReasonModal({ open, userEmail, value, onChange, onSubmit, onClose, loading, action = 'block' }) {
  if (!open) return null;
  
  const isBan = action === 'ban';
  const title = isBan ? 'Cấm vĩnh viễn user' : 'Tạm khóa user';
  const description = isBan 
    ? `Bạn sắp cấm vĩnh viễn <b>${userEmail}</b>. Vui lòng cung cấp lý do rõ ràng. Lý do này sẽ được gửi email cho user.`
    : `Bạn sắp tạm khóa <b>${userEmail}</b>. Vui lòng cung cấp lý do rõ ràng. Lý do này sẽ được gửi email cho user.`;
  const placeholder = isBan 
    ? "Mô tả vi phạm nghiêm trọng hoặc lý do cấm vĩnh viễn..."
    : "Mô tả vi phạm chính sách hoặc lý do tạm khóa...";
  const buttonText = isBan ? 'Gửi email và cấm vĩnh viễn' : 'Gửi email và tạm khóa';
  
  return (
    <div style={overlayStyle}>
      <div style={modalStyle} role="dialog" aria-modal="true" aria-labelledby="block-title">
        <div style={headerStyle}>
          <h3 id="block-title" style={titleStyle}>{title}</h3>
          <button aria-label="Close" onClick={onClose} style={{ background: 'transparent', border: 0, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>
        <div style={bodyStyle}>
          <p style={{ marginTop: 0, marginBottom: 10, color: '#475569' }}>{description}</p>
          <label htmlFor="block-reason" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Lý do</label>
          <textarea id="block-reason" style={textareaStyle} placeholder={placeholder} value={value} onChange={(e)=>onChange(e.target.value)} disabled={loading} />
        </div>
        <div style={footerStyle}>
          <button onClick={onClose} style={btn('secondary')} disabled={loading}>Hủy</button>
          <button onClick={onSubmit} style={btn('primary')} disabled={loading || !value?.trim()}>{buttonText}</button>
        </div>
      </div>
    </div>
  );
}



