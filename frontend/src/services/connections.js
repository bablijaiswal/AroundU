import api from './api';

export async function createConnection(payload) {
  const res = await api.post('/connections', payload);
  return res.data;
}

export async function fetchConnections(params = {}) {
  const res = await api.get('/connections', { params });
  return res.data;
}

export async function updateConnection(id, payload) {
  const res = await api.put(`/connections/${id}`, payload);
  return res.data;
}
