
import React from 'react';
import { Route, Routes as RouterRoutes } from 'react-router-dom';
import Index from '../pages/Index';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Pricing from '../pages/Pricing';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import ScriptGenerator from '../pages/ScriptGenerator';
import BriefGenerator from '../pages/BriefGenerator';
import Success from '../pages/Success';
import Projekty from '../pages/Projekty';

export const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/script-generator" element={<ScriptGenerator />} />
      <Route path="/brief-generator" element={<BriefGenerator />} />
      <Route path="/success" element={<Success />} />
      <Route path="/projekty" element={<Projekty />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};
