import React from 'react';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-gray-100">
      <div className="w-full max-w-md px-8 py-10 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg text-gray-800">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;