
import { useToast as useShadcnToast, toast as shadcnToast } from "@/components/ui/use-toast";

/**
 * Custom hook for using toast notifications
 */
export const useToast = useShadcnToast;

/**
 * Simplified toast function for use outside of React components
 */
export const toast = shadcnToast;
