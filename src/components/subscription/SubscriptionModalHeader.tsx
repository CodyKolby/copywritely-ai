
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface SubscriptionModalHeaderProps {
  title: string;
  description?: string;
}

const SubscriptionModalHeader: React.FC<SubscriptionModalHeaderProps> = ({ 
  title, 
  description 
}) => {
  return (
    <DialogHeader className="text-center pb-4">
      <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
      {description && (
        <DialogDescription className="mt-2">
          {description}
        </DialogDescription>
      )}
    </DialogHeader>
  );
};

export default SubscriptionModalHeader;
