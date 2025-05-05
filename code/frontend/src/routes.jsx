import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';      
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ProfilePage from './pages/ProfilePage';

const AppRoutes = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/"             element={ <Dashboard /> } />
        <Route path="/login"        element={ <Login /> } />
        <Route path="/register"     element={ <Register /> } />
        <Route path="/user"         element={ <ProfilePage /> } />
      </Routes>
      <Footer />
    </>
  );
};

export default AppRoutes;
