
import React from 'react';

const Footer = () => {
  return (
    <footer className="py-10 px-6 bg-gray-50 mt-auto">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-gray-600">
          © {new Date().getFullYear()} Copility. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
