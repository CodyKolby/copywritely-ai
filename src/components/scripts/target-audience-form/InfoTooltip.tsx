
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  text: string;
}

const InfoTooltip = ({ text }: InfoTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" className="h-6 w-6 p-0 rounded-full hover:bg-slate-100">
          <HelpCircle className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Info</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-sm">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default InfoTooltip;
