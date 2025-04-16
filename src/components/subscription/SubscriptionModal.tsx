
import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { useSubscriptionModal } from './useSubscriptionModal';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import NoSubscriptionState from './NoSubscriptionState';
import TrialState from './TrialState';
import PremiumSubscription from './PremiumSubscription';

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ open, onOpenChange }) => {
  const {
    data,
    isLoading,
    error,
    isPremiumButNoData,
    formatDate,
    renewSubscription,
    handleOpenPortal,
    fallbackData,
    handleRetry
  } = useSubscriptionModal(open);

  // Loading state
  if (isLoading) {
    return <LoadingState open={open} onOpenChange={onOpenChange} />;
  }

  // Error state or premium without subscription details
  if (isPremiumButNoData || error) {
    return <ErrorState 
      open={open} 
      onOpenChange={onOpenChange} 
      isPremium={isPremiumButNoData}
      error={error}
      onRetry={handleRetry}
    />;
  }

  // Premium users without subscription data (trial users)
  if (!data?.hasSubscription) {
    return <NoSubscriptionState open={open} onOpenChange={onOpenChange} />;
  }

  // Trial subscription state
  if (data.isTrial === true) {
    return (
      <TrialState
        open={open}
        onOpenChange={onOpenChange}
        formatDate={formatDate}
        expiryDate={data.currentPeriodEnd}
        daysRemaining={data.daysUntilRenewal}
        onOpenPortal={handleOpenPortal}
      />
    );
  }

  // Regular premium subscription
  return (
    <PremiumSubscription
      open={open}
      onOpenChange={onOpenChange}
      data={data}
      formatDate={formatDate}
      onRenew={renewSubscription}
      onOpenPortal={handleOpenPortal}
    />
  );
};

export default SubscriptionModal;
