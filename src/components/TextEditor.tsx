import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TextEditorProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  projectId?: string;
  projectTitle?: string;
}

const TextEditor = ({ 
  onSubmit, 
  placeholder = "Write your copy here...", 
  maxLength = 500,
  className,
  projectId,
  projectTitle = "New Copy Draft" 
}: TextEditorProps) => {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadDraft = async () => {
      if (projectId && user) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('content')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Error loading draft:', error);
            return;
          }
          
          if (data && data.content) {
            setText(data.content);
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    };

    loadDraft();
  }, [projectId, user]);

  const saveDraft = async () => {
    if (!user || !text.trim()) return;
    
    try {
      setIsSaving(true);
      
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update({ 
            content: text,
            updated_at: new Date().toISOString()
          })
          .eq('id', projectId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } 
      else {
        const { error } = await supabase
          .from('projects')
          .insert({
            title: projectTitle,
            content: text,
            user_id: user.id,
            status: 'Draft'
          });
        
        if (error) throw error;
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user && text.trim()) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        saveDraft();
      }, 10000);
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text, user]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
    }
  };

  const handleSubmit = async () => {
    if (text.trim()) {
      await saveDraft();
      onSubmit(text);
      
      if (projectId && user) {
        try {
          await supabase
            .from('projects')
            .update({ status: 'Completed' })
            .eq('id', projectId)
            .eq('user_id', user.id);
        } catch (error) {
          console.error('Error updating project status:', error);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textareaRef.current?.selectionStart || 0;
      const end = textareaRef.current?.selectionEnd || 0;
      
      const newText = text.substring(0, start) + '    ' + text.substring(end);
      setText(newText);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + 4;
          textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

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
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              {text.length}/{maxLength}
            </div>
            {lastSaved && (
              <div className="text-xs text-gray-400">
                Last saved: {lastSaved.toLocaleTimeString()}
              </div>
            )}
            {isSaving && (
              <div className="text-xs text-copywrite-teal">Saving...</div>
            )}
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
