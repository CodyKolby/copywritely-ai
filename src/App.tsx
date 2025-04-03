
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { AuthProvider } from "./contexts/auth/AuthProvider";
import Index from "./pages/Index";
import BriefGenerator from "./pages/BriefGenerator";
import ScriptGenerator from "./pages/ScriptGenerator";
import CopyEditor from "./pages/CopyEditor";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Projekty from "./pages/Projekty";
import Navbar from "./components/Navbar";
import Footer from "./components/home/Footer";
import AnimatedTransition from "./components/AnimatedTransition";
import Success from './pages/Success';
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LazyMotion features={domAnimation}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <div className="flex-grow">
                <AnimatedTransition>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/brief-generator" element={<BriefGenerator />} />
                    <Route path="/script-generator" element={<ScriptGenerator />} />
                    <Route path="/copy-editor" element={<CopyEditor />} />
                    <Route path="/copy-editor/:projectId" element={<CopyEditor />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/projekty" element={<Projekty />} />
                    <Route path="/success" element={<Success />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AnimatedTransition>
              </div>
              <Footer />
            </div>
          </BrowserRouter>
        </LazyMotion>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
