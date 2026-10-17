# AroundU 🌍

**Connect locally. Discover events. Help your community.**

AroundU is a full-stack community platform designed to help people discover nearby events, connect with people who share similar interests, and find or offer local services. It brings community engagement and local support together in one place.

## 🚀 Live Demo

**Website:** https://around-u-two.vercel.app/

**Backend API:** https://aroundu-backend-2dls.onrender.com/

## ✨ Features

- **User Authentication:** Sign up and log in using Firebase Authentication, including Google sign-in.
- **Events:** Discover and explore events and activities.
- **Join / Connect:** Create posts and connect with people in the community.
- **Help Hub:** Find or offer local help and services.
- **User Profiles:** Support community interactions through user profiles.
- **Real-Time Communication:** Socket.io integration for real-time features.
- **External Event Discovery:** Fetch event information using SerpApi.
- **AI Integration:** Gemini and Hugging Face integrations for assistant-related functionality.
- **Responsive UI:** A clean interface designed for community engagement.

## 🛠️ Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- REST APIs
- Socket.io

**Database & Authentication**
- MongoDB Atlas
- Firebase Authentication
- Firebase Admin SDK

**External Services**
- Cloud deployment with Vercel and Render
- SerpApi for external event search
- Google Gemini and Hugging Face integrations

## 🏗️ Project Structure

```text
AroundU/
├── frontend/       # React + Vite application
└── backend/        # Express API and Socket.io server
```

## ⚙️ Run Locally

### Prerequisites
- Node.js and npm
- MongoDB Atlas account or MongoDB instance
- Firebase project

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd AroundU
```

### 2. Set up the backend

```bash
cd backend
npm install
npm run dev
```

Configure the required backend environment variables in `backend/.env` before starting the server. Refer to the environment variable names used by the backend code.

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the frontend environment variables in `frontend/.env`, including the API URL, Socket.io URL, and Firebase configuration.

## 🔐 Environment Variables

Keep API keys, database credentials, JWT secrets, and Firebase Admin service-account credentials private. Do not commit `.env` files or service-account JSON files to GitHub.

Frontend environment variables used by Vite should use the `VITE_` prefix. Configure production environment variables separately in Vercel and Render.

## ☁️ Deployment

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## 🎯 Project Goal

AroundU aims to make local communities more connected by helping people discover activities, meet others, and access useful local support through a single platform.

## 👩‍💻 Author

Developed as a full-stack web development project.

---

If you find this project useful, feel free to explore the live demo and repository.
