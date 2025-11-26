import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from './api';
import Wizard from './wizard/Wizard';
import AdminDashboard from './admin/AdminDashboard';
import Login from './admin/Login';
import ChatWidget from './widget/ChatWidget';

function App() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const response = await api.get('/auth/check-setup');
      setIsSetup(response.data.is_setup);
    } catch (error) {
      console.error('Error checking setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/wizard" element={!isSetup ? <Wizard onComplete={() => setIsSetup(true)} /> : <Navigate to="/admin" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/widget" element={<div className="h-dvh w-screen overflow-hidden"><ChatWidget /></div>} />
        <Route path="/admin/*" element={isSetup && isAuthenticated() ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={isSetup ? "/admin" : "/wizard"} />} />
      </Routes>
    </Router>
  );
}

export default App;
