
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

// Import all step components
import StepAgeRange from './steps/StepAgeRange';
import StepGender from './steps/StepGender';
import StepCompetitors from './steps/StepCompetitors';
import StepLanguage from './steps/StepLanguage';
import StepBiography from './steps/StepBiography';
import StepBeliefs from './steps/StepBeliefs';
import StepPains from './steps/StepPains';
import StepDesires from './steps/StepDesires';
import StepMainOffer from './steps/StepMainOffer';
import StepOfferDetails from './steps/StepOfferDetails';
import StepBenefits from './steps/StepBenefits';
import StepWhyItWorks from './steps/StepWhyItWorks';
import StepExperience from './steps/StepExperience';
import StepAdvertisingGoal from './steps/StepAdvertisingGoal';

interface StepRendererProps {
  currentStep: number;
  form: UseFormReturn<FormValues>;
}

const StepRenderer = ({ currentStep, form }: StepRendererProps) => {
  switch (currentStep) {
    case 1:
      return <StepAgeRange form={form} />;
    case 2:
      return <StepGender form={form} />;
    case 3:
      return <StepCompetitors form={form} />;
    case 4:
      return <StepLanguage form={form} />;
    case 5:
      return <StepBiography form={form} />;
    case 6:
      return <StepBeliefs form={form} />;
    case 7:
      return <StepPains form={form} />;
    case 8:
      return <StepDesires form={form} />;
    case 9:
      return <StepMainOffer form={form} />;
    case 10:
      return <StepOfferDetails form={form} />;
    case 11:
      return <StepBenefits form={form} />;
    case 12:
      return <StepWhyItWorks form={form} />;
    case 13:
      return <StepExperience form={form} />;
    case 14:
      return <StepAdvertisingGoal form={form} />;
    default:
      return null;
  }
};

export default StepRenderer;
