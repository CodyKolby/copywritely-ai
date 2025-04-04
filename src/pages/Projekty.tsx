
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFilters from '@/components/projects/ProjectFilters';
import EmptyProjectsState from '@/components/projects/EmptyProjectsState';
import DeleteProjectDialog from '@/components/projects/DeleteProjectDialog';
import { useProjects } from '@/hooks/projects/useProjects';

const Projekty = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const {
    projects,
    loading,
    deleteDialogOpen,
    isDeleting,
    selectedProjectId,
    fetchProjects,
    handleOpenProject,
    handleDeleteDialog,
    handleDeleteProject,
    setDeleteDialogOpen
  } = useProjects(user?.id);

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(project => project.type === activeTab);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Twoje projekty</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={fetchProjects}
              className="text-gray-500 hover:text-copywrite-teal"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-gray-600 mb-8">
            Tutaj znajdziesz wszystkie swoje briefy i teksty stworzone w Copywritely AI.
          </p>

          <ProjectFilters activeTab={activeTab} onTabChange={setActiveTab} />

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-copywrite-teal" />
              <span className="ml-2 text-lg text-gray-600">Ładowanie projektów...</span>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDeleteDialog}
                  onOpen={handleOpenProject}
                />
              ))}
            </div>
          ) : (
            <EmptyProjectsState isAuthenticated={!!user} />
          )}
        </motion.div>
      </div>

      <DeleteProjectDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeleteProject}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default Projekty;
