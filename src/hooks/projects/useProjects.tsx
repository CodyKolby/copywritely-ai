
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Project {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
  type: 'brief' | 'script' | 'email' | 'social'; // Updated type options
  title_auto_generated?: boolean;
  subtype?: string; // Added for additional categorization
  subject?: string; // Added for email projects
  alternativeSubject?: string; // Added for alternative email subjects
}

interface RawProject {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
  user_id: string;
  type?: 'brief' | 'script' | 'email' | 'social';
  title_auto_generated?: boolean;
  subtype?: string;
  platform?: string;
  subject?: string;
  alternativeSubject?: string;
  metadata?: {
    alternativeSubject?: string;
    [key: string]: any;
  };
}

export const useProjects = (userId: string | undefined) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [loadingErrored, setLoadingErrored] = useState<boolean>(false);
  
  // New state variables for dialog control
  const [emailDialogOpen, setEmailDialogOpen] = useState<boolean>(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState<boolean>(false);
  const [socialDialogOpen, setSocialDialogOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Set timeout to avoid infinite loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Projects loading timeout reached');
        setLoading(false);
        setLoadingErrored(true);
        setProjects([]);
        toast.error('Nie udało się załadować projektów', {
          description: 'Spróbuj odświeżyć stronę'
        });
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const fetchProjects = useCallback(async () => {
    // If no userId, exit and reset loading state
    if (!userId) {
      setLoading(false);
      setProjects([]);
      return;
    }
    
    try {
      setLoading(true);
      setLoadingErrored(false);
      
      console.log('Fetching projects for user:', userId);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching projects:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No projects found for user');
        setProjects([]);
        setLoading(false);
        return;
      }
      
      // Handle the case where the 'type' field may not exist in some records
      const processedData = (data as RawProject[]).map(project => {
        let type = project.type || 'script';
        let subtype = project.subtype;
        
        // Convert platform to subtype if it exists
        if (project.platform && type === 'script') {
          type = 'social';
        }
        
        // If the type is 'script' but originally had no type, set subtype to 'ad' as default
        if ((type === 'script' && !project.type) || type === 'script') {
          subtype = subtype || 'ad';
        }
        
        // Extract alternativeSubject from metadata if it exists
        const alternativeSubject = project.metadata?.alternativeSubject || project.alternativeSubject;
        
        return {
          ...project,
          type,
          subtype,
          // Ensure title_auto_generated is defined
          title_auto_generated: project.title_auto_generated || false,
          // Set alternativeSubject from metadata or direct property
          alternativeSubject: alternativeSubject
        };
      });
      
      setProjects(processedData);
      console.log('Projects loaded successfully:', processedData.length);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoadingErrored(true);
      toast.error('Nie udało się pobrać projektów', {
        description: 'Spróbuj odświeżyć stronę',
        dismissible: true
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchProjects();
    } else {
      setLoading(false);
      setProjects([]);
    }
  }, [userId, fetchProjects]);

  const handleOpenProject = (projectId: string) => {
    console.log(`Opening project: ${projectId}`);
    
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      toast.error('Nie znaleziono projektu');
      return;
    }
    
    setSelectedProject(project);
    setSelectedProjectId(projectId);
    
    if (project?.type === 'brief') {
      toast.info('Funkcja edycji briefu będzie dostępna wkrótce', {
        dismissible: true
      });
    } else if (project?.type === 'email') {
      setEmailDialogOpen(true);
    } else if (project?.type === 'social') {
      setSocialDialogOpen(true);
    } else {
      // For regular scripts
      setScriptDialogOpen(true);
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
      
      // Remove the project from local state
      setProjects(projects.filter(project => project.id !== selectedProjectId));
      toast.success('Projekt został usunięty', {
        dismissible: true
      });
    } catch (error) {
      console.error('Error deleting project:', error);
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
    loadingErrored,
    fetchProjects,
    handleOpenProject,
    handleDeleteDialog,
    handleDeleteProject,
    setDeleteDialogOpen,
    // Dialog-related values
    emailDialogOpen,
    setEmailDialogOpen,
    scriptDialogOpen, 
    setScriptDialogOpen,
    socialDialogOpen,
    setSocialDialogOpen,
    selectedProject
  };
};
