
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScriptDisplayProps {
  script: string;
  bestHook: string;
  adStructure?: string;
  rawScript?: string;
}

const ScriptDisplay = ({ script, bestHook, adStructure = '', rawScript }: ScriptDisplayProps) => {
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
    } else if (adStructure === 'AIDA') {
      return 'Attention → Interest → Desire → Action';
    }
    return '';
  };

  const toggleRawScript = () => {
    setShowRaw(!showRaw);
  };

  const adStructureDescription = getAdStructureDescription();

  // Łączymy hook i skrypt do wyświetlenia
  const fullScriptDisplay = `${bestHook}\n\n${showRaw && rawScript ? rawScript : script}`;
  const displayScript = showRaw && rawScript ? rawScript : script;

  return (
    <div className="space-y-6">
      <div className="bg-copywrite-teal/10 p-4 rounded-md border border-copywrite-teal/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-copywrite-teal">Szczegóły skryptu:</h3>
          {rawScript && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center gap-1" 
              onClick={toggleRawScript}
            >
              <Sparkles className="h-3 w-3" />
              {showRaw ? 'Pokaż wersję zredagowaną' : 'Pokaż wersję oryginalną'}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {adStructure && (
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
          
          {rawScript && (
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {showRaw ? 'Wersja oryginalna' : 'Wersja zredagowana'}
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
