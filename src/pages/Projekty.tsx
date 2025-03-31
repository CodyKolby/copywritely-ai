
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, FileText, Newspaper, Loader2, FilePlus, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
  type: 'brief' | 'script';
  title_auto_generated?: boolean;
}

const Projekty = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchProjects = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setProjects(data as Project[]);
      console.log('Pobrano projekty:', data);
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
    fetchProjects();
  }, [user]);

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(project => project.type === activeTab);

  const getProjectIcon = (project: Project) => {
    if (project.type === 'brief') {
      return <FileText className="text-copywrite-teal" />;
    } else if (project.type === 'script') {
      return <Newspaper className="text-copywrite-teal-dark" />;
    } else {
      return <File className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'Draft' | 'Completed' | 'Reviewed') => {
    switch(status) {
      case 'Draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Wersja robocza</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ukończony</Badge>;
      case 'Reviewed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Zweryfikowany</Badge>;
      default:
        return <Badge variant="outline">Nieznany</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

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

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">Wszystkie</TabsTrigger>
              <TabsTrigger value="brief">Briefy</TabsTrigger>
              <TabsTrigger value="script">Teksty</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-copywrite-teal" />
              <span className="ml-2 text-lg text-gray-600">Ładowanie projektów...</span>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {getProjectIcon(project)}
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription>{formatDate(project.created_at)}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-600 line-clamp-3">{project.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex justify-between items-center w-full">
                        <div>{getStatusBadge(project.status)}</div>
                        <div className="flex gap-2">
                          <button 
                            className="text-sm text-copywrite-teal hover:text-copywrite-teal-dark transition-colors"
                            onClick={() => handleOpenProject(project.id)}
                          >
                            Otwórz
                          </button>
                          <button 
                            className="text-sm text-red-500 hover:text-red-700 transition-colors ml-4"
                            onClick={() => handleDeleteDialog(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 border rounded-lg bg-white">
              <p className="text-gray-500 mb-6">Nie masz jeszcze żadnych projektów.</p>
              {!user ? (
                <p className="text-sm text-gray-400">Zaloguj się, aby zobaczyć swoje projekty.</p>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/brief-generator">
                    <Button className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2 w-full sm:w-auto">
                      <FileText size={18} />
                      <span>Stwórz brief</span>
                    </Button>
                  </Link>
                  <Link to="/script-generator">
                    <Button className="bg-copywrite-teal-dark hover:bg-copywrite-teal flex items-center gap-2 w-full sm:w-auto">
                      <Newspaper size={18} />
                      <span>Stwórz skrypt</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten projekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Po usunięciu projektu nie będzie można go przywrócić.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                "Usuń"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projekty;
