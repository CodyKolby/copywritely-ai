
import React from 'react';
import { Badge } from "@/components/ui/badge";

interface SubscriptionStatusBadgeProps {
  status: string;
  isTrial?: boolean;
  isCanceled?: boolean;
}

const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({ 
  status, 
  isTrial, 
  isCanceled 
}) => {
  const isActive = status === 'active' || status === 'trialing';
  
  let statusText = 'Aktywna';
  let statusColor = 'bg-green-500';
  
  if (isActive && isTrial) {
    statusText = 'Okres próbny';
    statusColor = 'bg-blue-500';
  } else if (isActive && isCanceled) {
    statusText = 'Anulowana';
    statusColor = 'bg-yellow-500';
  } else if (!isActive) {
    statusText = 'Nieaktywna';
    statusColor = 'bg-red-500';
  }
  
  return (
    <div className="flex items-center gap-2 mb-2">
      <Badge className={`px-2 py-1 ${statusColor}`}>
        {statusText}
      </Badge>
    </div>
  );
};

export default SubscriptionStatusBadge;
