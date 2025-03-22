import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, FileText, Newspaper, Loader2, FilePlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

interface Project {
  id: string;
  title: string;
  content: string;
  status: 'Draft' | 'Completed' | 'Reviewed';
  created_at: string;
  updated_at: string;
}

const Projekty = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
    } catch (error) {
      console.error('Błąd podczas pobierania projektów:', error);
      toast.error('Nie udało się pobrać projektów');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(project => {
        if (activeTab === 'brief' || activeTab === 'copy') {
          return project.title.toLowerCase().includes(activeTab);
        }
        return true;
      });

  const getProjectIcon = (title: string) => {
    if (title.toLowerCase().includes('brief')) {
      return <FileText className="text-copywrite-teal" />;
    } else if (title.toLowerCase().includes('tekst') || title.toLowerCase().includes('copy')) {
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
    toast.info('Funkcja edycji projektu będzie dostępna wkrótce');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Twoje projekty</h1>
          <p className="text-gray-600 mb-8">
            Tutaj znajdziesz wszystkie swoje briefy i teksty stworzone w Copywritely AI.
          </p>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">Wszystkie</TabsTrigger>
              <TabsTrigger value="brief">Briefy</TabsTrigger>
              <TabsTrigger value="copy">Teksty</TabsTrigger>
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
                        {getProjectIcon(project.title)}
                        <div>
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
                        <button 
                          className="text-sm text-copywrite-teal hover:text-copywrite-teal-dark transition-colors"
                          onClick={() => handleOpenProject(project.id)}
                        >
                          Otwórz
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 border rounded-lg bg-white">
              <p className="text-gray-500 mb-6">Nie masz jeszcze żadnych projektów. Stwórz swój pierwszy tekst!</p>
              {!user ? (
                <p className="text-sm text-gray-400">Zaloguj się, aby zobaczyć swoje projekty.</p>
              ) : (
                <Link to="/brief-generator">
                  <Button className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2">
                    <FilePlus size={18} />
                    <span>Stwórz nowy brief</span>
                  </Button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Projekty;
