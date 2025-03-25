
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
}

const GeneratedScriptDialog = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
}: GeneratedScriptDialogProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [generatedScript, setGeneratedScript] = useState<string>('');

  useEffect(() => {
    if (open && targetAudienceId) {
      // Symulacja ładowania danych - w przyszłości zastąp rzeczywistym API
      setIsLoading(true);
      const timer = setTimeout(() => {
        // Tymczasowo generujemy przykładowy skrypt
        const sampleScript = generateSampleScript(templateId);
        setGeneratedScript(sampleScript);
        setIsLoading(false);
      }, 3000); // 3 sekundy opóźnienia
      
      return () => clearTimeout(timer);
    }
  }, [open, targetAudienceId, templateId]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    toast.success('Skrypt skopiowany do schowka');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedScript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `skrypt-${templateId}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Skrypt pobrany');
  };

  // Funkcja generująca przykładowy skrypt na podstawie templateId
  const generateSampleScript = (templateId: string): string => {
    // W przyszłości zastąp to rzeczywistym generowaniem skryptu
    return `# Przykładowy skrypt dla szablonu: ${templateId}

## Wprowadzenie
Witaj w naszym skrypcie przygotowanym specjalnie dla Twojej grupy docelowej!

## Główne punkty
1. Zacznij od nawiązania kontaktu z odbiorcą
2. Przedstaw główne korzyści Twojej oferty
3. Pokaż, jak Twój produkt rozwiązuje problemy odbiorcy
4. Zaprezentuj case study lub historie sukcesu
5. Zakończ mocnym wezwaniem do działania

## Szczegółowy opis
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.

## Przykładowe dialogi
- "Czy zauważyłeś, że [problem] staje się coraz większym wyzwaniem?"
- "Nasz produkt pozwala na [korzyść] bez konieczności [negatywny aspekt konkurencji]"
- "W ciągu ostatnich 6 miesięcy pomogliśmy ponad 100 klientom osiągnąć [rezultat]"

## Zakończenie
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span>Wygenerowany Skrypt</span>
          </DialogTitle>
          <DialogDescription>
            Oto skrypt wygenerowany na podstawie informacji o Twojej grupie docelowej.
            Możesz go skopiować lub pobrać do dalszej edycji.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 space-y-4">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copywrite-teal"></div>
            </div>
            <p className="text-center text-gray-500">Generujemy skrypt dla Twojej grupy docelowej...</p>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : (
          <div className="py-4">
            <ScrollArea className="h-[400px] rounded-md border p-4 bg-slate-50">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {generatedScript}
              </pre>
            </ScrollArea>
            
            <DialogFooter className="mt-6 flex justify-between sm:justify-end gap-4">
              <Button 
                variant="outline" 
                className="flex items-center gap-2" 
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4" />
                Kopiuj do schowka
              </Button>
              <Button 
                className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Pobierz skrypt
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedScriptDialog;
