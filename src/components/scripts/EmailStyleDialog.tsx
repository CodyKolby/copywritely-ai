
import React from 'react';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export type EmailStyle = 'direct-sales' | 'educational' | 'story' | 'relationship';

interface EmailStyleOption {
  id: EmailStyle;
  title: string;
  description: string;
}

const emailStyleOptions: EmailStyleOption[] = [
  {
    id: 'direct-sales',
    title: 'Bezpośrednia sprzedaż',
    description: 'Skoncentrowany na natychmiastowym promowaniu i sprzedaży produktu lub usługi, z wyraźnym wezwaniem do działania.'
  },
  {
    id: 'educational',
    title: 'Edukacyjny',
    description: 'Dostarczający wartościowych informacji i edukujący odbiorcę na temat problemu lub potrzeby, budując tym samym zaufanie do marki.'
  },
  {
    id: 'story',
    title: 'Opowieść',
    description: 'Opowiadający angażującą historię, która rezonuje z odbiorcą, tworząc emocjonalne połączenie i prezentując produkt lub usługę w kontekście narracyjnym.'
  },
  {
    id: 'relationship',
    title: 'Budowanie relacji',
    description: 'Mail mający na celu wzmocnienie relacji z odbiorcą poprzez personalizację, dzielenie się aktualnościami firmy lub zapraszanie do interakcji, bez bezpośredniego nacisku na sprzedaż.'
  }
];

interface EmailStyleDialogProps {
  onSubmit: (style: EmailStyle) => void;
  onBack: () => void;
  onCancel: () => void;
  isProcessing: boolean; // Added isProcessing prop
}

const EmailStyleDialog = ({ onSubmit, onBack, onCancel, isProcessing }: EmailStyleDialogProps) => {
  const [selectedStyle, setSelectedStyle] = React.useState<EmailStyle | null>(null);

  const handleSubmit = () => {
    if (selectedStyle) {
      onSubmit(selectedStyle);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Jaki styl ma mieć mail marketingowy?</DialogTitle>
        <DialogDescription>
          Wybierz, w jaki sposób chcesz komunikować swoją wiadomość.
        </DialogDescription>
      </DialogHeader>

      <RadioGroup value={selectedStyle || ''} onValueChange={(value) => setSelectedStyle(value as EmailStyle)} className="px-2">
        <div className="grid gap-4 mt-4">
          {emailStyleOptions.map((option) => (
            <Card key={option.id} className={`p-4 cursor-pointer transition-all ${selectedStyle === option.id ? 'border-copywrite-teal ring-2 ring-copywrite-teal/20' : 'hover:border-gray-300'}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor={option.id} className="text-lg font-medium">
                    {option.title}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <DialogFooter className="flex justify-between px-2">
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Anuluj
          </Button>
          <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
            Wstecz
          </Button>
        </div>
        <Button 
          type="button" 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
          disabled={!selectedStyle || isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Przetwarzanie...
            </>
          ) : (
            "Dalej"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default EmailStyleDialog;
