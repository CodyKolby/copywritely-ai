
import React from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { FormValues } from './types';

interface StepContainerProps {
  currentStep: number;
  form: UseFormReturn<FormValues>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLFormElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

const StepContainer = ({ currentStep, form, handleKeyDown, onSubmit, children }: StepContainerProps) => {
  return (
    <Form {...form}>
      <form className="space-y-8 relative" onKeyDown={handleKeyDown} onSubmit={onSubmit} style={{ overflow: 'visible' }}>
        <div className="py-6 px-4 md:px-6" style={{ overflow: 'visible' }}>
          <Tabs value={currentStep.toString()}>
            <TabsContent value={currentStep.toString()} className="mt-0 pb-4 px-2 md:px-4" style={{ overflow: 'visible' }}>
              {children}
            </TabsContent>
          </Tabs>
        </div>
      </form>
    </Form>
  );
};

export default StepContainer;
