import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import AroundUAssistant from '../components/AroundUAssistant';

export default function MainLayout() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar onAssistantOpen={() => setAssistantOpen(true)} />
      <div className="main-panel">
        <Navbar />
        <main className="page-content">
          {assistantOpen ? (
            <AroundUAssistant open={assistantOpen} onClose={() => setAssistantOpen(false)} />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
