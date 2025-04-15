
// Import the actual toast components from shadcn UI
import { useToast as useShadcnToastOriginal, toast as shadcnToastOriginal } from "@/components/ui/toast";

// Re-export them with our custom names
export const useToast = useShadcnToastOriginal;
export const toast = shadcnToastOriginal;
