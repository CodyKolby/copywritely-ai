
import { Check } from "lucide-react";

interface PricingFeatureItemProps {
  text: string;
}

export const PricingFeatureItem = ({ text }: PricingFeatureItemProps) => {
  return (
    <li className="flex items-start">
      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
};
