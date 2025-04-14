
import React from 'react';
import { CalendarClock, Clock } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import SubscriptionStatusBadge from './SubscriptionStatusBadge';
import { SubscriptionDetails as SubscriptionDetailsType } from '@/lib/stripe/subscription';

interface SubscriptionDetailsProps {
  data: SubscriptionDetailsType;
  formatDate: (date: string) => string;
}

const SubscriptionDetails: React.FC<SubscriptionDetailsProps> = ({ data, formatDate }) => {
  const isTrial = data.isTrial === true;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plan {data.plan}</h3>
      </div>
      
      <SubscriptionStatusBadge 
        status={data.status} 
        isTrial={isTrial} 
        isCanceled={data.cancelAtPeriodEnd} 
      />
      
      <div className="flex items-center text-sm text-gray-600 gap-2">
        <CalendarClock className="h-4 w-4" />
        <span>
          {data.cancelAtPeriodEnd 
            ? 'Aktywna do' 
            : isTrial
              ? 'Koniec okresu próbnego'
              : 'Następne odnowienie'}: {formatDate(data.currentPeriodEnd)}
        </span>
      </div>
      
      {!data.cancelAtPeriodEnd && (
        <div className="flex items-center text-sm text-gray-600 gap-2">
          <Clock className="h-4 w-4" />
          <span>
            {data.daysUntilRenewal} {data.daysUntilRenewal === 1 ? 'dzień' : 
              data.daysUntilRenewal < 5 ? 'dni' : 'dni'} do {isTrial ? 'końca' : 'odnowienia'}
          </span>
        </div>
      )}
      
      <Separator className="my-2" />
    </div>
  );
};

export default SubscriptionDetails;
