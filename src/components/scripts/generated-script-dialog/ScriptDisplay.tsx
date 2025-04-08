
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScriptDisplayProps {
  script: string;
  bestHook: string;
  hookIndex?: number;
  totalHooks?: number;
  adStructure?: string;
  rawScript?: string;
}

const ScriptDisplay = ({ 
  script, 
  bestHook, 
  hookIndex = 0, 
  totalHooks = 0, 
  adStructure = '', 
  rawScript 
}: ScriptDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const handleCopy = async () => {
    try {
      // Łączymy hook i skrypt w jeden tekst do kopiowania
      const fullScript = `${bestHook}\n\n${script}`;
      await navigator.clipboard.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    // Łączymy hook i skrypt w jeden tekst do pobrania
    const fullScript = `${bestHook}\n\n${script}`;
    const element = document.createElement('a');
    const file = new Blob([fullScript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'wygenerowany-skrypt.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getAdStructureDescription = () => {
    if (adStructure === 'PAS') {
      return 'Problem → Agitation → Solution';
    }
    return '';
  };

  const adStructureDescription = getAdStructureDescription();

  // Łączymy hook i skrypt do wyświetlenia
  const displayScript = showRaw && rawScript ? rawScript : script;

  // Sprawdź, czy to post na social media - jeśli nie ma struktury reklamowej, nie pokazuj jej
  const isSocialMediaPost = !adStructure || adStructure.trim() === '';

  return (
    <div className="space-y-6">
      <div className="bg-copywrite-teal/10 p-4 rounded-md border border-copywrite-teal/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-copywrite-teal">Szczegóły skryptu:</h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {!isSocialMediaPost && adStructure && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="bg-copywrite-teal/20 text-copywrite-teal border-copywrite-teal/30 flex items-center gap-1">
                    {adStructure}
                    {adStructureDescription && <Info size={12} />}
                  </Badge>
                </TooltipTrigger>
                {adStructureDescription && (
                  <TooltipContent>
                    <p>{adStructureDescription}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
          
          {totalHooks > 0 && (
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Hook {hookIndex + 1} z {totalHooks}
            </Badge>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-[50vh] overflow-y-auto">
        <div className="mb-4 py-2 px-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm font-medium">
          {bestHook}
        </div>
        <pre className="whitespace-pre-wrap text-sm">{displayScript}</pre>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={handleCopy} className="flex items-center gap-2">
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Skopiowano
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Kopiuj
            </>
          )}
        </Button>
        <Button variant="default" onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Pobierz
        </Button>
      </div>
    </div>
  );
};

export default ScriptDisplay;
