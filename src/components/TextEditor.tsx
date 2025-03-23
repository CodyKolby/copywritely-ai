
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  const [localProjectId, setLocalProjectId] = useState<string | undefined>(projectId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const testUserIdRef = useRef<string | null>(null);
  const { user, profile } = useAuth();

  // Generate and store a consistent UUID for test users
  useEffect(() => {
    if (user && user.id === 'test-user-id' && !testUserIdRef.current) {
      // Create a stable UUID based on a fixed string for test users
      testUserIdRef.current = uuidv4();
      console.log('Generated persistent UUID for test user:', testUserIdRef.current);
    }
  }, [user]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!localProjectId || !user) return;
      
      // For test users, check localStorage first
      if (user.id === 'test-user-id') {
        const localDraft = localStorage.getItem(`draft_${localProjectId}`);
        if (localDraft) {
          try {
            const parsedDraft = JSON.parse(localDraft);
            console.log('Loaded draft from localStorage:', parsedDraft);
            if (parsedDraft.content) {
              setText(parsedDraft.content);
              return;
            }
          } catch (e) {
            console.error('Error parsing local draft:', e);
          }
        }
      }
      
      // For all users: Try to load from the database
      try {
        console.log('Loading draft for project:', localProjectId);
        
        const { data, error } = await supabase
          .from('projects')
          .select('content')
          .eq('id', localProjectId)
          .single();
        
        if (error) {
          console.error('Error loading draft:', error);
          return;
        }
        
        if (data && data.content) {
          console.log('Draft loaded successfully from database');
          setText(data.content);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadDraft();
  }, [localProjectId, user]);

  // Helper function to get the correct user ID, handling test users
  const getCurrentUserId = () => {
    if (!user) return null;
    
    // For test users, use the persistent UUID reference
    if (user.id === 'test-user-id') {
      if (!testUserIdRef.current) {
        testUserIdRef.current = uuidv4();
        console.log('Generated new UUID for test user:', testUserIdRef.current);
      }
      return testUserIdRef.current;
    }
    
    return user.id;
  };

  const saveDraft = async () => {
    if (!user || !text.trim()) return;
    
    try {
      setIsSaving(true);
      
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('No valid user ID available');
      }
      
      console.log('Saving draft using user ID:', userId);
      
      if (localProjectId) {
        // If we're dealing with a test user and we've previously saved to localStorage
        if (user.id === 'test-user-id') {
          const localDraft = localStorage.getItem(`draft_${localProjectId}`);
          if (localDraft) {
            // Update the localStorage entry
            const savedDraft = JSON.parse(localDraft);
            savedDraft.content = text;
            savedDraft.updated_at = new Date().toISOString();
            localStorage.setItem(`draft_${localProjectId}`, JSON.stringify(savedDraft));
            setLastSaved(new Date());
            console.log('Draft updated in localStorage for test user');
            toast.success('Draft saved locally (test user mode)');
            return;
          }
        }
        
        // Try to update in database
        try {
          console.log('Updating existing project:', localProjectId);
          const { error } = await supabase
            .from('projects')
            .update({ 
              content: text,
              updated_at: new Date().toISOString()
            })
            .eq('id', localProjectId);
          
          if (error) {
            console.error('Update error:', error);
            throw error;
          }
          
          console.log('Draft updated successfully in database');
        } catch (dbError) {
          // If database update fails and it's a test user, fallback to localStorage
          if (user.id === 'test-user-id') {
            console.log('Database update failed, using localStorage for test user');
            localStorage.setItem(`draft_${localProjectId}`, JSON.stringify({
              id: localProjectId,
              title: projectTitle,
              content: text,
              status: 'Draft',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            toast.success('Draft saved locally (test user mode)');
          } else {
            throw dbError;
          }
        }
      } 
      else {
        // Create new project with a new ID
        const newProjectId = uuidv4();
        console.log('Creating new project with ID:', newProjectId, 'for user ID:', userId);
        
        // For test users, always use localStorage for simplicity
        if (user.id === 'test-user-id') {
          localStorage.setItem(`draft_${newProjectId}`, JSON.stringify({
            id: newProjectId,
            title: projectTitle,
            content: text,
            user_id: userId,
            status: 'Draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));
          setLocalProjectId(newProjectId);
          console.log('New draft saved to localStorage for test user');
          toast.success('Draft saved locally (test user mode)');
        } else {
          // Regular authenticated users - use database
          try {
            const { data, error } = await supabase
              .from('projects')
              .insert({
                id: newProjectId,
                title: projectTitle,
                content: text,
                user_id: userId,
                status: 'Draft'
              })
              .select('id')
              .single();
            
            if (error) {
              console.error('Insert error:', error);
              throw error;
            }
            
            // Store the newly created project ID
            if (data) {
              setLocalProjectId(data.id);
              console.log('Project created successfully with ID:', data.id);
            }
          } catch (error) {
            console.error('Error creating new project:', error);
            toast.error('Failed to save draft');
            return;
          }
        }
      }
      
      setLastSaved(new Date());
      console.log('Draft saved successfully at:', new Date().toLocaleTimeString());
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
      
      if (localProjectId) {
        // For test users, update the status in localStorage
        if (user && user.id === 'test-user-id') {
          const localDraft = localStorage.getItem(`draft_${localProjectId}`);
          if (localDraft) {
            try {
              const savedDraft = JSON.parse(localDraft);
              savedDraft.status = 'Completed';
              localStorage.setItem(`draft_${localProjectId}`, JSON.stringify(savedDraft));
              console.log('Project status updated to Completed in localStorage');
            } catch (e) {
              console.error('Error updating project status in localStorage:', e);
            }
          }
        } else {
          // For regular users, update in database
          try {
            const { error } = await supabase
              .from('projects')
              .update({ status: 'Completed' })
              .eq('id', localProjectId);
            
            if (error) {
              console.error('Error updating project status:', error);
            }
          } catch (error) {
            console.error('Error updating project status:', error);
          }
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
