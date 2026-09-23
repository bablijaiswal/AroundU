import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import JoinConnectPage from './pages/JoinConnectPage';
import CreatePostPage from './pages/CreatePostPage';
import PostDetailsPage from './pages/PostDetailsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import HelpHubPage from './pages/HelpHubPage';
import CreateHelpRequestPage from './pages/CreateHelpRequestPage';
import HelpDetailsPage from './pages/HelpDetailsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailsPage />} />
          <Route path="search" element={<SearchResultsPage />} />
          <Route path="join-connect" element={<JoinConnectPage />} />
          <Route path="posts/:id" element={<PostDetailsPage />} />
          <Route path="help-hub" element={<HelpHubPage />} />
          <Route path="help/:id" element={<HelpDetailsPage />} />
          <Route path="profile/:id" element={<ProfilePage />} />

          <Route path="create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="create-help-request" element={<ProtectedRoute><CreateHelpRequestPage /></ProtectedRoute>} />
          <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
