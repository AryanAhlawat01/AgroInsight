const TOKEN_KEY = 'agroinsight_token';
const API_BASE = '/api';

const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const stateMap = [
  { name: 'Punjab', lat: 30.9, lng: 75.8 },
  { name: 'Tamil Nadu', lat: 11.0, lng: 78.0 },
  { name: 'Uttar Pradesh', lat: 26.8, lng: 80.9 },
  { name: 'Maharashtra', lat: 19.0, lng: 72.8 },
  { name: 'Bihar', lat: 25.6, lng: 85.1 },
];

const toast = document.getElementById('toast');
const showToast = (message, type = 'success') => {
  toast.textContent = message;
  toast.style.borderColor = type === 'error' ? 'rgba(232,93,38,0.45)' : 'rgba(92,138,60,0.45)';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
};

const redirectToLogin = () => {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login.html';
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(options.headers || {}) },
    ...options,
  });
  const payload = await res.json();
  if (res.status === 401) {
    redirectToLogin();
    return null;
  }
  return payload;
};

const setUserInfo = (user) => {
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-email').textContent = user.email;
};

const setMetrics = (stats) => {
  document.getElementById('metric-records').textContent = stats.totalRecords || 0;
  document.getElementById('metric-states').textContent = stats.stateCount || 0;
  document.getElementById('metric-districts').textContent = stats.districtCount || 0;
  document.getElementById('metric-well').textContent = `${stats.avgWellDepth || '—'}m`;
};

const loadRecentSubmissions = async () => {
  const result = await request('submissions?page=1&limit=12');
  const body = document.getElementById('submission-body');
  if (!result?.success) return;
  body.innerHTML = result.data.map((item) => `
    <tr>
      <td>${item.state}</td>
      <td>${item.district}</td>
      <td>${item.land_size ?? '—'}</td>
      <td>${item.irrigation_src ?? '—'}</td>
      <td>${item.kharif_crop || '—'}</td>
      <td>${item.createdAt.slice(0, 10)}</td>
    </tr>
  `).join('');
};

const loadStats = async () => {
  const result = await request('stats');
  if (result?.success) setMetrics(result);
};

const initMap = () => {
  const map = L.map('map').setView([22.5, 79], 5.2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  stateMap.forEach((state) => {
    L.marker([state.lat, state.lng]).addTo(map).bindPopup(`<strong>${state.name}</strong>`);
  });
};

const handlePredict = async () => {
  const data = {
    land_size: document.getElementById('ai-land').value,
    irrigation_src: document.getElementById('ai-irrigation').value,
    soil_type: document.getElementById('ai-soil').value,
    region: document.getElementById('ai-region').value,
  };
  const result = await request('predict', { method: 'POST', body: JSON.stringify(data) });
  if (!result?.success) {
    showToast(result?.error || 'Prediction failed', 'error');
    return;
  }
  const p = result.data.prediction;
  document.getElementById('prediction-result').innerHTML = `
    <strong>Crop:</strong> ${p.recommended_crop}<br>
    <strong>Irrigation:</strong> ${p.irrigation_source}<br>
    <strong>Advice:</strong> ${p.soil_advice}<br>
    <strong>Confidence:</strong> ${p.confidence}
  `;
};

const handleSubmission = async (event) => {
  event.preventDefault();
  const data = {
    state: document.getElementById('f-state')?.value || null,
    district: document.getElementById('f-district')?.value || null,
    land_size: document.getElementById('f-land')?.value || null,
    land_category: document.getElementById('f-category')?.value || null,
    irrigation_src: document.getElementById('f-irrigation')?.value || null,
    well_depth: document.getElementById('f-depth')?.value || null,
    kharif_crop: document.getElementById('f-kharif')?.value || null,
    rabi_crop: document.getElementById('f-rabi')?.value || null,
    crop_intensity: document.getElementById('f-intensity')?.value || null,
    soil_type: document.getElementById('f-soil')?.value || null,
    notes: document.getElementById('f-notes')?.value || null,
  };

  const result = await request('submissions', { method: 'POST', body: JSON.stringify(data) });
  if (result?.success) {
    showToast('Submission saved successfully');
    loadStats();
    loadRecentSubmissions();
    document.getElementById('data-form').reset();
    return;
  }
  showToast(result?.error || 'Unable to save submission', 'error');
};

const connectRealtime = () => {
  const socket = io();
  socket.on('connect', () => showToast('Realtime updates enabled'));
  socket.on('newSubmission', () => {
    loadStats();
    loadRecentSubmissions();
  });
};

window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return redirectToLogin();

  const userResult = await request('auth/me');
  if (!userResult?.success) return;
  setUserInfo(userResult.data);

  document.getElementById('logout').addEventListener('click', redirectToLogin);
  document.getElementById('predict-button').addEventListener('click', handlePredict);
  document.getElementById('data-form').addEventListener('submit', handleSubmission);

  loadStats();
  loadRecentSubmissions();
  initMap();
  connectRealtime();
});
