import api from './api';

export async function fetchPosts(params = {}) {
  try {
    const res = await api.get('/posts', { params });
    if (res.data && res.data.success) return res.data.data;
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function fetchPostById(id) {
  try {
    const res = await api.get(`/posts/${id}`);
    if (res.data && res.data.success) return res.data.data;
    return res.data;
  } catch (err) {
    throw err;
  }
}

export async function createPost(payload) {
  const res = await api.post('/posts', payload);
  return res.data;
}

export async function updatePost(id, payload, userId = 'Anjali') {
  const res = await api.put(`/posts/${id}`, payload, {
    headers: { 'x-user-id': userId },
  });
  return res.data;
}

export async function deletePost(id, userId = 'Anjali') {
  const res = await api.delete(`/posts/${id}`, {
    headers: { 'x-user-id': userId },
  });
  return res.data;
}
