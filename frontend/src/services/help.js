import api from './api';

export async function fetchHelp(params = {}) {
  const res = await api.get('/help', { params });
  return res.data;
}

export async function fetchHelpById(id) {
  const res = await api.get(`/help/${id}`);
  return res.data;
}

export async function createHelp(payload) {
  const res = await api.post('/help', payload);
  return res.data;
}

export async function updateHelp(id, payload) {
  const res = await api.put(`/help/${id}`, payload);
  return res.data;
}

export async function deleteHelp(id) {
  const res = await api.delete(`/help/${id}`);
  return res.data;
}

export async function respondToHelp(id, payload) {
  const res = await api.post(`/help/${id}/respond`, payload);
  return res.data;
}
