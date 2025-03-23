
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const PricingFAQ = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-20 text-center"
    >
      <h2 className="text-3xl font-bold mb-8">Masz pytania?</h2>
      <div className="flex justify-center">
        <Button variant="outline" className="border-copywrite-teal text-copywrite-teal">
          Skontaktuj się z nami
        </Button>
      </div>
    </motion.div>
  );
};
