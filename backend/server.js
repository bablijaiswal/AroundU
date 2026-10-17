import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import postRoutes from './routes/postRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import helpRoutes from './routes/helpRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { initializeSocket } from './socket/index.js';
import { initializeFirebaseAdmin } from './config/firebaseAdmin.js';
import geminiChatRoutes from "./routes/geminiTestRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const configuredOrigin = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = [
  configuredOrigin,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5001',
].filter(Boolean);

function corsOriginCheck(origin, callback) {
  if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    callback(null, true);
  } else {
    callback(null, true);
  }
}

const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    credentials: true,
  },
});

app.set('io', io);
initializeSocket(io);

app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'AroundU API root' });
});
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
// Mount event API before the section mock routes so it takes precedence
app.use('/api', eventRoutes);
app.use('/api', postRoutes);
app.use('/api', connectionRoutes);
app.use('/api', messageRoutes);
app.use('/api', conversationRoutes);
app.use('/api/help', helpRoutes);
app.use('/api', sectionRoutes);
app.use("/api/gemini", geminiChatRoutes);
app.use(notFound);
app.use(errorHandler);



const port = process.env.PORT || 5001;

async function start() {
  initializeFirebaseAdmin();
  await connectDB(process.env.MONGODB_URI);

  server.listen(port, () => {
    console.log(`AroundU backend running on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
