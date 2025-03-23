
import { PRICE_IDS } from "@/lib/stripe";

export type BillingCycle = 'annual' | 'monthly';

export const getProPrice = (billingCycle: BillingCycle): string => {
  return billingCycle === 'annual' ? '39.99' : '79.99';
};

export const getPricingLabel = (): string => {
  return 'miesięcznie';
};

export const getPriceId = (billingCycle: BillingCycle): string => {
  return billingCycle === 'annual' 
    ? PRICE_IDS.PRO_ANNUAL
    : PRICE_IDS.PRO_MONTHLY;
};
