
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface TextEditorProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

const TextEditor = ({ 
  onSubmit, 
  placeholder = "Write your copy here...", 
  maxLength = 500,
  className 
}: TextEditorProps) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      
      const newText = text.substring(0, start) + '    ' + text.substring(end);
      setText(newText);
      
      // Set cursor position after the inserted tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative', className)}
    >
      <div 
        className={cn(
          'relative transition-all duration-300 rounded-xl border',
          isFocused 
            ? 'border-copywrite-teal shadow-[0_0_0_3px_rgba(13,93,86,0.1)]' 
            : 'border-gray-200 hover:border-gray-300'
        )}
      >
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[200px] resize-none p-5 text-base leading-relaxed"
        />
        
        <div className="flex items-center justify-between p-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {text.length}/{maxLength}
          </div>
          
          <Button 
            onClick={handleSubmit}
            className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
            disabled={!text.trim()}
          >
            Submit
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default TextEditor;
