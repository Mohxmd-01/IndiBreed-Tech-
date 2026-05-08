import { useEffect, useState } from 'react';
import { Link2, Phone, CheckCircle, XCircle, Users } from 'lucide-react';
import { useVet } from '../../context/VetContext';

const inp = { width:'100%', padding:'11px 14px', fontSize:'13px', color:'#0f172a', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' };

export default function VetLinkFarmer() {
  const { farmers, loadFarmers, farmersLoading, farmersError, links, pendingLinks, loadLinks, requestLink, respondToLink } = useVet();
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { loadFarmers(true); loadLinks(); }, [loadFarmers, loadLinks]);

  const sendRequest = async () => {
    if (!phone || phone.length < 10) return setErr('Enter a valid 10-digit phone number.');
    setLoading(true); setErr(''); setSuccess('');
    try {
      const res = await requestLink(phone, message);
      setSuccess(`✅ Link request sent to ${res.farmerName}! They need to accept it from their Profile.`);
      setPhone(''); setMessage('');
      loadFarmers(true); // refresh list
    } catch(e) {
      const status = e.response?.status;
      const msg    = e.response?.data?.error || '';
      if (status === 401)
        setErr('Not authenticated — please logout and login again via the demo button or your credentials.');
      else if (status === 409 && msg.includes('Already linked'))
        setSuccess('✅ Already linked to this farmer! Check My Farmers below to see them.');
      else if (status === 409)
        setSuccess('⏳ A link request is already pending with this farmer. Waiting for their approval.');
      else if (status === 404)
        setErr(`No farmer found with phone ${phone}. Make sure they are registered on NiralFarm.`);
      else if (!e.response)
        setErr('Cannot reach the server. Make sure the backend is running on port 4000.');
      else
        setErr(msg || 'Failed to send request.');
    } finally { setLoading(false); }
  };

  const respond = async (id, accept) => {
    try { await respondToLink(id, accept); }
    catch(e) { setErr(e.response?.data?.error || 'Failed'); }
  };

  const RISK_COLOR = { high:'#dc2626', medium:'#d97706', low:'#16a34a' };
  const RISK_BG    = { high:'#fee2e2', medium:'#fef3c7', low:'#dcfce7' };

  return (
    <div style={{ padding:'1.25rem 1.5rem', maxWidth:'620px', margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ margin:'0 0 4px', fontSize:'1.35rem', fontWeight:800, color:'#0f172a' }}>Link Farmers</h1>
        <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>Link with farmers to see their urgent cases in your feed.</p>
      </div>

      {/* Send Request */}
      <div style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'16px', padding:'1.25rem', marginBottom:'1.25rem' }}>
        <h2 style={{ margin:'0 0 1rem', fontSize:'14px', fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:'8px' }}>
          <Link2 size={15} color="#16a34a" /> Send Link Request
        </h2>
        {err && <div style={{ padding:'9px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'9px', fontSize:'12px', color:'#dc2626', marginBottom:'10px' }}>{err}</div>}
        {success && <div style={{ padding:'9px 12px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'9px', fontSize:'12px', color:'#16a34a', fontWeight:600, marginBottom:'10px' }}>✓ {success}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <div style={{ position:'relative' }}>
            <Phone size={14} style={{ position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input style={{ ...inp, paddingLeft:'38px' }} placeholder="Farmer's Phone Number *" type="tel" maxLength={10} value={phone} onChange={e=>{ setPhone(e.target.value.replace(/\D/g,'')); setErr(''); }} />
          </div>
          <textarea style={{ ...inp, minHeight:'56px', resize:'none' }} placeholder="Optional message to farmer..." value={message} onChange={e=>setMessage(e.target.value)} />
          <button onClick={sendRequest} disabled={loading} style={{ padding:'12px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', border:'none', borderRadius:'11px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
            {loading ? 'Sending...' : 'Send Link Request →'}
          </button>
        </div>
      </div>

      {/* Pending incoming requests */}
      {pendingLinks.length > 0 && (
        <div style={{ background:'#fffbeb', border:'1.5px solid #fde68a', borderRadius:'16px', padding:'1.25rem', marginBottom:'1.25rem' }}>
          <h2 style={{ margin:'0 0 1rem', fontSize:'14px', fontWeight:700, color:'#92400e' }}>⏳ Pending Requests ({pendingLinks.length})</h2>
          {pendingLinks.map(link => (
            <div key={link._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #fde68a' }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{link.farmerId?.name}</p>
                <p style={{ margin:0, fontSize:'11px', color:'#92400e' }}>{link.farmerId?.phone} · {link.farmerId?.village}</p>
              </div>
              <div style={{ display:'flex', gap:'6px' }}>
                <button onClick={() => respond(link._id, true)} style={{ padding:'6px 12px', background:'#16a34a', color:'white', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                  <CheckCircle size={11} /> Accept
                </button>
                <button onClick={() => respond(link._id, false)} style={{ padding:'6px 10px', background:'white', color:'#ef4444', border:'1px solid #fca5a5', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                  <XCircle size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linked Farmers */}
      <div>
        <h2 style={{ margin:'0 0 1rem', fontSize:'13px', fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.05em', display:'flex', alignItems:'center', gap:'8px' }}>
          <Users size={14} color="#374151" /> My Farmers ({farmers.length})
        </h2>
        {farmersLoading && <div style={{ textAlign:'center', padding:'1rem', color:'#94a3b8', fontSize:'13px' }}>Loading farmers...</div>}
        {farmersError && !farmersLoading && (
          <div style={{ padding:'12px 14px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'12px', marginBottom:'8px' }}>
            <p style={{ margin:'0 0 6px', fontSize:'12px', fontWeight:700, color:'#dc2626' }}>⚠️ {farmersError}</p>
            <button onClick={() => loadFarmers(true)} style={{ fontSize:'11px', fontWeight:700, color:'#dc2626', background:'none', border:'1px solid #fca5a5', borderRadius:'7px', padding:'4px 10px', cursor:'pointer' }}>Retry</button>
          </div>
        )}
        {!farmersLoading && !farmersError && farmers.length === 0 && (
          <div style={{ padding:'20px', textAlign:'center', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
            <p style={{ margin:0, fontSize:'13px', color:'#94a3b8' }}>No linked farmers yet. Send a request above.</p>
          </div>
        )}
        {farmers.map(f => (
          <div key={f._id} style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'14px', padding:'13px 15px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'40px', background:'#f0fdf4', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#16a34a', fontSize:'16px', flexShrink:0 }}>
              {f.name?.[0] || '?'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{f.name}</p>
              <p style={{ margin:'0 0 2px', fontSize:'11px', color:'#64748b' }}>{f.farmName || f.phone} · {f.village}</p>
              <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>{f.cattleCount} cattle · {f.openAlerts} open alert{f.openAlerts!==1?'s':''}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
              <span style={{ fontSize:'10px', fontWeight:700, color: RISK_COLOR[f.riskLevel]||'#64748b', background: RISK_BG[f.riskLevel]||'#f1f5f9', padding:'2px 8px', borderRadius:'6px', textTransform:'capitalize' }}>{f.riskLevel} risk</span>
              {f.phone && <a href={`tel:${f.phone}`} style={{ fontSize:'11px', color:'#0284c7', textDecoration:'none', fontWeight:600 }}>📞 Call</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
