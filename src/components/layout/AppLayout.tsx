
import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/home/Footer';  // Importuję Footer

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />  {/* Dodaję komponent Footer */}
    </div>
  );
};
