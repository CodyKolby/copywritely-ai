
import React from 'react';
import { SubscriptionDetails as SubscriptionDetailsType } from '@/lib/stripe/subscription';
import { CalendarClock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionDetailsProps {
  data: SubscriptionDetailsType;
  formatDate: (date: string) => string;
}

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({ data, formatDate }) => {
  // Check if subscription has already expired
  const isExpired = new Date(data.currentPeriodEnd) <= new Date();
  
  // Make sure days until renewal is never negative
  const daysRemaining = isExpired ? 0 : Math.max(0, data.daysUntilRenewal);
  
  // Helper for Polish plurality
  const getDayText = (days: number) => {
    if (days === 1) return 'dzień';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'dni';
    return 'dni';
  };

  // Determine subscription type and badge style
  const isTrial = data.isTrial === true || data.status === 'trialing';
  const isExpiring = data.cancelAtPeriodEnd;
  const isPaused = data.status === 'paused';
  const isActive = !isExpired && (data.status === 'active' || isTrial);
  
  let badgeLabel = 'Aktywna';
  let badgeColor = 'bg-green-500';
  
  if (isExpired) {
    badgeLabel = 'Wygasła';
    badgeColor = 'bg-red-500';
  } else if (isTrial) {
    badgeLabel = 'Okres próbny';
    badgeColor = 'bg-blue-500';
  } else if (isExpiring) {
    badgeLabel = 'Wygasająca';
    badgeColor = 'bg-yellow-500';
  } else if (isPaused) {
    badgeLabel = 'Wstrzymana';
    badgeColor = 'bg-gray-500';
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Plan {data.plan || 'Premium'}
        </h3>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Badge className={`px-2 py-1 ${badgeColor}`}>
          {badgeLabel}
        </Badge>
      </div>
      
      {!isExpired && (
        <>
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <CalendarClock className="h-4 w-4" />
            <span>
              {isExpiring ? 'Wygasa' : isTrial ? 'Koniec okresu próbnego' : 'Następna płatność'}: {formatDate(data.currentPeriodEnd)}
            </span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600 gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {daysRemaining} {getDayText(daysRemaining)} do {isExpiring ? 'wygaśnięcia' : isTrial ? 'końca okresu próbnego' : 'odnowienia'}
            </span>
          </div>
        </>
      )}
      
      {isExpired && (
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <Clock className="h-4 w-4" />
          <span>Twoja subskrypcja wygasła {formatDate(data.currentPeriodEnd)}</span>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDetails;
