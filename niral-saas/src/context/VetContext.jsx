/**
 * VetContext.jsx — State management for the Veterinarian portal.
 * Answers: "Which case needs me right now?"
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api, { vetAPI } from '../services/api';

const VetCtx = createContext(null);

export function VetProvider({ children, vetUser }) {
  const [section, setSection]           = useState('feed');
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(false);

  // Feed data
  const [feed, setFeed]                 = useState({ urgentCases: [], todayVisits: [], recentTreatments: [], linkedFarmers: 0 });
  const [feedLoading, setFeedLoading]   = useState(false);
  const [feedError, setFeedError]       = useState(null);

  // Farmers
  const [farmers, setFarmers]           = useState([]);
  const [farmersLoading, setFarmersLoading] = useState(false);
  const [farmersError, setFarmersError] = useState(null);

  // Treatments
  const [treatments, setTreatments]     = useState([]);
  const [treatmentsLoading, setTreatmentsLoading] = useState(false);

  // Visits
  const [visits, setVisits]             = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // Links (pending)
  const [links, setLinks]               = useState([]);
  const [pendingLinks, setPendingLinks] = useState([]);

  // Farmer detail
  const [farmerDetail, setFarmerDetail] = useState(null);
  const [farmerDetailLoading, setFarmerDetailLoading] = useState(false);

  // Profile
  const [profile, setProfile]           = useState(null);

  const hasFetched = useRef({});

  const loadFeed = useCallback(async (force = false) => {
    if (hasFetched.current.feed && !force) return;
    setFeedLoading(true); setFeedError(null);
    try {
      const res = await api.get('/vet/feed');
      setFeed(res.data);
      hasFetched.current.feed = true;
    } catch (e) {
      setFeedError(e.response?.data?.error || 'Failed to load feed');
    } finally { setFeedLoading(false); }
  }, []);

  const loadFarmers = useCallback(async (force = false) => {
    if (hasFetched.current.farmers && !force) return;
    setFarmersLoading(true); setFarmersError(null);
    try {
      const res = await api.get('/vet/farmers');
      setFarmers(res.data.farmers || []);
      hasFetched.current.farmers = true;
    } catch(e) {
      setFarmersError(e.response?.data?.error || (e.response ? 'Failed to load farmers' : 'Server offline'));
    } finally { setFarmersLoading(false); }
  }, []);

  const loadFarmerDetail = useCallback(async (farmerId) => {
    setFarmerDetailLoading(true); setFarmerDetail(null);
    try {
      const res = await api.get(`/vet/farmers/${farmerId}`);
      setFarmerDetail(res.data);
    } catch { setFarmerDetail(null); } finally { setFarmerDetailLoading(false); }
  }, []);

  const loadTreatments = useCallback(async (force = false) => {
    if (hasFetched.current.treatments && !force) return;
    setTreatmentsLoading(true);
    try {
      const res = await api.get('/vet/treatments');
      setTreatments(res.data.treatments || []);
      hasFetched.current.treatments = true;
    } catch { /* silent */ } finally { setTreatmentsLoading(false); }
  }, []);

  const loadVisits = useCallback(async (force = false) => {
    if (hasFetched.current.visits && !force) return;
    setVisitsLoading(true);
    try {
      const res = await api.get('/vet/visits');
      setVisits(res.data.visits || []);
      hasFetched.current.visits = true;
    } catch { /* silent */ } finally { setVisitsLoading(false); }
  }, []);

  const loadLinks = useCallback(async () => {
    try {
      const [linksRes, pendingRes] = await Promise.all([
        api.get('/vet/links'),
        api.get('/vet/links/pending'),
      ]);
      setLinks(linksRes.data.links || []);
      setPendingLinks(pendingRes.data.pending || []);
    } catch { /* silent */ }
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get('/vet/profile');
      setProfile(res.data);
    } catch { /* silent */ }
  }, []);

  // Actions
  const addTreatment = useCallback(async (data) => {
    const res = await api.post('/vet/treatments', data);
    setTreatments(prev => [res.data.treatment, ...prev]);
    hasFetched.current.feed = false; // refresh feed next time
    return res.data.treatment;
  }, []);

  const scheduleVisit = useCallback(async (data) => {
    const res = await api.post('/vet/visits', data);
    setVisits(prev => [res.data.visit, ...prev]);
    return res.data.visit;
  }, []);

  const completeVisit = useCallback(async (id, notes) => {
    const res = await api.put(`/vet/visits/${id}/complete`, { notes });
    setVisits(prev => prev.map(v => v._id === id ? res.data.visit : v));
    hasFetched.current.feed = false;
    return res.data.visit;
  }, []);

  const cancelVisit = useCallback(async (id) => {
    await api.put(`/vet/visits/${id}/cancel`);
    setVisits(prev => prev.map(v => v._id === id ? { ...v, status: 'cancelled' } : v));
  }, []);

  const requestLink = useCallback(async (phone, message) => {
    const res = await api.post('/vet/link/request', { phone, message });
    await loadLinks();
    return res.data;
  }, [loadLinks]);

  const respondToLink = useCallback(async (id, accept) => {
    const res = await api.put(`/vet/link/${id}`, { accept });
    await loadLinks();
    return res.data;
  }, [loadLinks]);

  const navigate = useCallback((sec, farmerId = null) => {
    setSection(sec);
    if (farmerId) setSelectedFarmerId(farmerId);
    setSidebarOpen(false);
  }, []);

  // Load feed on mount
  useEffect(() => { loadFeed(); }, [loadFeed]);

  const urgentCount = feed.urgentCases?.filter(c => !c.resolved).length || 0;

  return (
    <VetCtx.Provider value={{
      vetUser, section, navigate, selectedFarmerId, sidebarOpen, setSidebarOpen,
      feed, feedLoading, feedError, loadFeed,
      farmers, farmersLoading, farmersError, loadFarmers,
      farmerDetail, farmerDetailLoading, loadFarmerDetail,
      treatments, treatmentsLoading, loadTreatments, addTreatment,
      visits, visitsLoading, loadVisits, scheduleVisit, completeVisit, cancelVisit,
      links, pendingLinks, loadLinks, requestLink, respondToLink,
      profile, loadProfile,
      urgentCount,
    }}>
      {children}
    </VetCtx.Provider>
  );
}

export const useVet = () => useContext(VetCtx);
