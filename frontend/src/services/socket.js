import { io } from 'socket.io-client';
import { auth } from '../firebase/firebase';

const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '');

const SOCKET_OPTIONS = {
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
};

const globalSocket = globalThis.__aroundUSocket;
const socket = globalSocket || io(SOCKET_URL, SOCKET_OPTIONS);

if (!globalSocket) {
  globalThis.__aroundUSocket = socket;
}

export async function identifySocketUser(user) {
  if (!user) return;
  try {
    const token = await auth.currentUser?.getIdToken();
    socket.emit('user:join', {
      userId: user.id || user.uid,
      mongoId: user.id,
      firebaseUid: user.uid || user.firebaseUid,
      token,
    });
  } catch (err) {
    socket.emit('user:join', {
      userId: user.id || user.uid,
      mongoId: user.id,
      firebaseUid: user.uid || user.firebaseUid,
    });
  }
}

socket.on('connect', () => {
  console.log('AroundU socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('AroundU socket disconnected:', reason);
});

export default socket;