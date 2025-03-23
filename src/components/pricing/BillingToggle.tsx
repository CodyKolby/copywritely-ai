
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BillingCycle = 'annual' | 'monthly';

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (value: BillingCycle) => void;
}

export const BillingToggle = ({ value, onChange }: BillingToggleProps) => {
  return (
    <div className="flex justify-center mb-8">
      <Tabs
        defaultValue="annual"
        value={value}
        onValueChange={(value) => onChange(value as BillingCycle)}
        className="bg-gray-100 p-1 rounded-full"
      >
        <TabsList className="grid grid-cols-2 w-[280px]">
          <TabsTrigger value="monthly" className="rounded-full">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annual" className="rounded-full">
            Annual <span className="ml-1 text-green-600 text-xs font-medium">(Save 50%)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
