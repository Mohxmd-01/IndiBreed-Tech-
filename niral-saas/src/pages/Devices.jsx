import { Radio, Plus, Wifi, WifiOff, Battery, Clock, RefreshCw, Thermometer, Activity } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../data';
import { devicesAPI } from '../services/api';

function AddCollarModal({ cattle, onClose, onSave }) {
  const [collarId, setCollarId] = useState('');
  const [cowId, setCowId] = useState(cattle[0]?.id || '');
  const [scanned, setScanned] = useState('');
  const [tab, setTab] = useState('manual');
  const simulate = () => { const id = 'SC-' + Math.floor(1000 + Math.random() * 8999); setCollarId(id); setScanned(id); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Add Smart Collar</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {['manual', 'qr'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {t === 'manual' ? 'Enter ID' : 'Scan QR'}
              </button>
            ))}
          </div>
          {tab === 'manual' ? (
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Collar ID *</label>
              <input className="input" value={collarId} onChange={e => setCollarId(e.target.value)} placeholder="SC-1234" /></div>
          ) : (
            <div className="text-center">
              <div className="w-32 h-32 border-2 border-green-500 rounded-xl mx-auto flex items-center justify-center bg-green-50 relative overflow-hidden">
                <div className="w-full h-0.5 bg-green-400 animate-bounce absolute" />
                <Radio size={32} className="text-green-400" />
              </div>
              <button onClick={simulate} className="btn-secondary mx-auto mt-3 text-xs">Simulate Scan (Demo)</button>
              {scanned && <p className="text-xs text-green-600 font-semibold mt-2">✓ Scanned: {scanned}</p>}
            </div>
          )}
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Link to Cattle</label>
            <select className="select" value={cowId} onChange={e => setCowId(e.target.value)}>
              {cattle.map(c => <option key={c.id} value={c.id}>{c.name} ({c.tagId})</option>)}
            </select>
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { if (!collarId.trim()) return; onSave(collarId, cowId); }} className="btn-primary">Add Device</button>
        </div>
      </div>
    </div>
  );
}

export default function Devices() {
  const { db, update, isOnline } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [liveDevices, setLiveDevices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const onlineCount = db.devices.filter(d => d.status === 'online').length;
  const lowBat      = db.devices.filter(d => d.battery < 30).length;

  // Merge local db.devices with live backend data
  const devices = liveDevices.length > 0 ? liveDevices : db.devices;

  const fetchLiveDevices = useCallback(async () => {
    if (!isOnline) return;
    setRefreshing(true);
    try {
      const r = await devicesAPI.list();
      if (r.data?.devices?.length) {
        setLiveDevices(r.data.devices);
        setLastRefresh(Date.now());
      }
    } catch { /* stay on local data */ }
    finally { setRefreshing(false); }
  }, [isOnline]);

  // Poll every 30s when online
  useEffect(() => {
    fetchLiveDevices();
    if (!isOnline) return;
    const interval = setInterval(fetchLiveDevices, 30000);
    return () => clearInterval(interval);
  }, [isOnline, fetchLiveDevices]);

  const addDevice = (collarId, cowId) => {
    update(d => {
      if (d.devices.find(dv => dv.collarId === collarId)) return d;
      d.devices.push({ id: 'DEV' + Date.now(), collarId, linkedCowId: cowId, battery: 100, signal: 90, lastSync: Date.now(), status: 'online', firmware: 'v2.3.2', temp: 38.5, activity: 60, lat: 20.012, lng: 73.789 });
      const cow = d.cattle.find(c => c.id === cowId); if (cow) cow.collarId = collarId;
      return d;
    });
    setShowAdd(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {showAdd && <AddCollarModal cattle={db.cattle} onClose={() => setShowAdd(false)} onSave={addDevice} />}

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {[
            { l: 'Total',   v: devices.length,                              c: 'text-gray-900' },
            { l: 'Online',  v: devices.filter(d => d.status === 'online').length, c: 'text-green-600' },
            { l: 'Offline', v: devices.filter(d => d.status === 'offline').length, c: 'text-red-500' },
            { l: 'Low Bat', v: devices.filter(d => d.battery < 30).length, c: 'text-yellow-600' },
          ].map(x => (
            <div key={x.l} className="card px-4 py-3 text-center min-w-[70px]">
              <p className={`text-lg font-bold ${x.c}`}>{x.v}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{x.l}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isOnline && (
            <button onClick={fetchLiveDevices} disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Updating…' : lastRefresh ? `Updated ${timeAgo(lastRefresh)}` : 'Refresh'}
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="btn-primary shrink-0"><Plus size={16} />Add Collar</button>
        </div>
      </div>

      {/* Live badge */}
      {isOnline && liveDevices.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live IoT data — auto-refreshes every 30s
        </div>
      )}

      <div className="space-y-3">
        {devices.map(dv => {
          const cow = db.cattle.find(c => c.id === (dv.linkedCowId || dv.clientCowId));
          const batColor = dv.battery >= 60 ? 'bg-green-500' : dv.battery >= 30 ? 'bg-yellow-400' : 'bg-red-500';
          const batText  = dv.battery >= 60 ? 'text-green-600' : dv.battery >= 30 ? 'text-yellow-600' : 'text-red-600';
          return (
            <div key={dv.id || dv._id} className="card p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dv.status === 'online' ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <Radio size={20} className={dv.status === 'online' ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-gray-900">{dv.collarId}</p>
                    <span className={`badge ${dv.status === 'online' ? 'badge-green' : 'badge-gray'}`}>
                      {dv.status === 'online' ? <><Wifi size={10} /> online</> : <><WifiOff size={10} /> offline</>}
                    </span>
                    {dv.temp > 39.5 && <span className="badge badge-red">🌡️ {dv.temp}°C</span>}
                    {isOnline && liveDevices.length > 0 && <span className="badge badge-blue text-[9px]">LIVE</span>}
                  </div>
                  <p className="text-sm text-gray-600">{cow ? `Linked: ${cow.name} (${cow.tagId})` : 'Unlinked'}</p>

                  {/* Live telemetry row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Thermometer size={11} className={dv.temp > 39.5 ? 'text-red-500' : 'text-gray-400'} />{dv.temp}°C</span>
                    <span className="flex items-center gap-1"><Activity size={11} className="text-gray-400" />{dv.activity}% activity</span>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1"><Battery size={10} /> Battery</span>
                        <span className={`text-xs font-bold ${batText}`}>{dv.battery}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${batColor} rounded-full`} style={{ width: `${dv.battery}%` }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-gray-500">Signal</span>
                        <span className="text-xs font-bold text-blue-600">{dv.signal}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${dv.signal}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0 text-xs text-gray-400">
                  <p className="flex items-center gap-1 justify-end"><Clock size={11} />{timeAgo(dv.lastSync)}</p>
                  <p className="mt-1">{dv.firmware}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
