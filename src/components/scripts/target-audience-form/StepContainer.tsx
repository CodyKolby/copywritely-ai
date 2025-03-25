
import React from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

interface StepContainerProps {
  currentStep: number;
  form: UseFormReturn<FormValues>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

const StepContainer = ({ currentStep, form, handleKeyDown, children }: StepContainerProps) => {
  return (
    <Form {...form}>
      <form className="space-y-6 relative overflow-visible" onKeyDown={handleKeyDown}>
        <div className="py-4 overflow-visible">
          <Tabs value={currentStep.toString()}>
            <TabsContent value={currentStep.toString()} className="mt-0 pb-2 overflow-visible">
              {children}
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </Form>
  );
};

export default StepContainer;
