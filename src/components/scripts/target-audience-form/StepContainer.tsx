
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
      <form className="space-y-6 relative" onKeyDown={handleKeyDown} style={{ overflow: 'visible' }}>
        <div className="py-4" style={{ overflow: 'visible' }}>
          <Tabs value={currentStep.toString()}>
            <TabsContent value={currentStep.toString()} className="mt-0 pb-2" style={{ overflow: 'visible' }}>
              {children}
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </Form>
  );
};

export default StepContainer;
