
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 px-6 bg-gray-900 text-white">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Left side - Logo */}
          <div className="flex flex-col">
            <Link to="/" className="mb-4">
              <img 
                src="/lovable-uploads/ca5d4ef6-6381-4c48-a3a6-be71b24f9bb6.png" 
                alt="Copility" 
                className="h-10" 
              />
            </Link>
          </div>
          
          {/* Right side - Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Link to="/about" className="block hover:text-copywrite-teal transition-colors">
                O nas
              </Link>
              <Link to="/contact" className="block hover:text-copywrite-teal transition-colors">
                Kontakt
              </Link>
            </div>
            <div className="space-y-3">
              <Link to="/privacy-policy" className="block hover:text-copywrite-teal transition-colors">
                Polityka prywatności
              </Link>
              <Link to="/terms-of-service" className="block hover:text-copywrite-teal transition-colors">
                Regulamin
              </Link>
            </div>
            <div className="space-y-3">
              <Link to="/pricing" className="block hover:text-copywrite-teal transition-colors">
                Plany
              </Link>
            </div>
          </div>
        </div>
        
        {/* Social Media Icons */}
        <div className="flex justify-center space-x-6 mb-8">
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-copywrite-teal transition-colors">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="lucide"
            >
              <path d="M9 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>
              <path d="M15 8c0 5 2 8 2 8"></path>
              <path d="M9 12V4"></path>
              <path d="M12 4h4"></path>
            </svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-copywrite-teal transition-colors">
            <Instagram size={24} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-copywrite-teal transition-colors">
            <Linkedin size={24} />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-copywrite-teal transition-colors">
            <Facebook size={24} />
          </a>
        </div>
        
        {/* Copyright */}
        <div className="text-center text-gray-400 border-t border-gray-800 pt-8">
          <p>© 2025 Copility. Wszelkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
