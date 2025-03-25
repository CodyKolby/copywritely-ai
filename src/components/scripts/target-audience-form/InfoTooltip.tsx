
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-slate-100">
        <HelpCircle className="h-4 w-4 text-slate-500" />
        <span className="sr-only">Info</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent 
      side="top" 
      align="center" 
      className="max-w-xs text-sm p-3 break-words z-[999] border border-gray-200 shadow-lg bg-white"
      sideOffset={5}
      forceMount
    >
      {text}
    </PopoverContent>
  </Popover>
);

export default InfoTooltip;
