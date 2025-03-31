
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ScriptDisplayProps {
  script: string;
  bestHook: string;
  adStructure?: string;
}

const ScriptDisplay = ({ script, bestHook, adStructure = '' }: ScriptDisplayProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([script], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'wygenerowany-skrypt.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {bestHook && (
        <div className="bg-copywrite-teal/10 p-4 rounded-md border border-copywrite-teal/20">
          <h3 className="font-medium text-copywrite-teal mb-2">Najlepszy Hook:</h3>
          <p className="text-lg italic">{bestHook}</p>
          
          {adStructure && (
            <div className="mt-3 flex items-center">
              <span className="text-sm font-medium mr-2">Zalecana struktura reklamy:</span>
              <Badge variant="outline" className="bg-copywrite-teal/20 text-copywrite-teal border-copywrite-teal/30">
                {adStructure}
              </Badge>
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-md border border-gray-200 max-h-[50vh] overflow-y-auto">
        <pre className="whitespace-pre-wrap text-sm">{script}</pre>
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
