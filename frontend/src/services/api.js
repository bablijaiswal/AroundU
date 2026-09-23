import axios from 'axios';
import { auth } from '../firebase/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return config;

  try {
    const token = await currentUser.getIdToken();
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.warn('Unable to attach Firebase token to API request.', error);
  }

  return config;
});

export default api;
