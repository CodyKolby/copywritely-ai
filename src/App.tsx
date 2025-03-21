
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";
import Index from "./pages/Index";
import BriefGenerator from "./pages/BriefGenerator";
import CopyEditor from "./pages/CopyEditor";
import About from "./pages/About";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import AnimatedTransition from "./components/AnimatedTransition";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatedTransition>
        </BrowserRouter>
      </LazyMotion>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
