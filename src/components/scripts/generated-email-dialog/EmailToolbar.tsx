
import React from 'react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4,
  Heading5,
  List,
  ListOrdered,
  Link,
  Image,
  Code
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface EmailToolbarProps {
  className?: string;
}

const EmailToolbar: React.FC<EmailToolbarProps> = ({ className }) => {
  return (
    <div className={`w-full flex items-center gap-1 p-2 bg-gray-50 border-b ${className}`}>
      <div className="flex items-center gap-1 px-2">
        <button className="p-1.5 rounded hover:bg-gray-200">
          <span className="font-sans text-gray-700">A</span>
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="currentColor" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Bold className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Italic className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Underline className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1 px-2">
        <button className="px-1.5 py-1 rounded hover:bg-gray-200 flex items-center gap-1">
          <span className="text-sm text-gray-700">16</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-700">
            <path d="M7 10l5 5 5-5z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1 px-2">
        <button className="p-1.5 rounded hover:bg-gray-200">
          <AlignLeft className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <AlignCenter className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <AlignRight className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1 px-2">
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Heading1 className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Heading2 className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Heading3 className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Heading4 className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Heading5 className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1 px-2">
        <button className="p-1.5 rounded hover:bg-gray-200">
          <List className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <ListOrdered className="h-4 w-4 text-gray-700" />
        </button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1 px-2">
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Link className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Code className="h-4 w-4 text-gray-700" />
        </button>
        <button className="p-1.5 rounded hover:bg-gray-200">
          <Image className="h-4 w-4 text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default EmailToolbar;
