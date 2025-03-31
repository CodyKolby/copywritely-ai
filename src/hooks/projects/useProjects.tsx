
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
  type: 'brief' | 'script'; // Changed from optional to required
  title_auto_generated?: boolean;
}

interface RawProject {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
  user_id: string;
  type?: 'brief' | 'script';
  title_auto_generated?: boolean;
}

export const useProjects = (userId: string | undefined) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchProjects = async () => {
    // If no userId, exit and reset loading state
    if (!userId) {
      setLoading(false);
      setProjects([]);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Handle the case where the 'type' field may not exist in some records
      const processedData = (data as RawProject[]).map(project => ({
        ...project,
        // Set a default 'script' type if type is missing
        type: project.type || 'script',
        // Ensure title_auto_generated is defined
        title_auto_generated: project.title_auto_generated || false
      }));
      
      setProjects(processedData);
      console.log('Pobrano projekty:', processedData);
    } catch (error) {
      console.error('Błąd podczas pobierania projektów:', error);
      toast.error('Nie udało się pobrać projektów', {
        dismissible: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setLoading(false);
      setProjects([]);
    }
  }, [userId]);

  const handleOpenProject = (projectId: string) => {
    console.log(`Otwieranie projektu: ${projectId}`);
    
    const project = projects.find(p => p.id === projectId);
    
    if (project?.type === 'brief') {
      toast.info('Funkcja edycji briefu będzie dostępna wkrótce', {
        dismissible: true
      });
    } else if (project?.type === 'script') {
      // Dla skryptów przekierowujemy do edytora kopii
      window.location.href = `/copy-editor/${projectId}`;
    } else {
      toast.info('Funkcja edycji projektu będzie dostępna wkrótce', {
        dismissible: true
      });
    }
  };

  const handleDeleteDialog = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', selectedProjectId);
      
      if (error) {
        throw error;
      }
      
      // Usuń projekt z lokalnego stanu
      setProjects(projects.filter(project => project.id !== selectedProjectId));
      toast.success('Projekt został usunięty', {
        dismissible: true
      });
    } catch (error) {
      console.error('Błąd podczas usuwania projektu:', error);
      toast.error('Nie udało się usunąć projektu', {
        dismissible: true
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedProjectId(null);
    }
  };

  return {
    projects,
    loading,
    selectedProjectId,
    deleteDialogOpen,
    isDeleting,
    fetchProjects,
    handleOpenProject,
    handleDeleteDialog,
    handleDeleteProject,
    setDeleteDialogOpen
  };
};
