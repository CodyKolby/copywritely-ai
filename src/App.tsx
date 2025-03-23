import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import { AuthProvider } from "./contexts/auth/AuthContext";
import Index from "./pages/Index";
import BriefGenerator from "./pages/BriefGenerator";
import CopyEditor from "./pages/CopyEditor";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Projekty from "./pages/Projekty";
import Navbar from "./components/Navbar";
import AnimatedTransition from "./components/AnimatedTransition";
import Success from './pages/Success';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LazyMotion features={domAnimation}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navbar />
            <AnimatedTransition>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/brief-generator" element={<BriefGenerator />} />
                <Route path="/copy-editor" element={<CopyEditor />} />
                <Route path="/copy-editor/:projectId" element={<CopyEditor />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/projekty" element={<Projekty />} />
                <Route path="/success" element={<Success />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatedTransition>
          </BrowserRouter>
        </LazyMotion>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
