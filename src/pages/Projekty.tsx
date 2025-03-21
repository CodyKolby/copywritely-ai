
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { File, FileText, Newspaper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Types for our projects
interface Project {
  id: string;
  title: string;
  type: 'brief' | 'copy';
  created: string;
  content: string;
}

const Projekty = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In a real app, we would fetch projects from Supabase here
    // For now, let's use mock data
    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'Kampania reklamowa dla marki sportowej',
        type: 'brief',
        created: '2023-05-15',
        content: 'Brief dla kampanii skierowanej do młodych sportowców...'
      },
      {
        id: '2',
        title: 'Tekst na stronę główną firmy',
        type: 'copy',
        created: '2023-06-20',
        content: 'Witamy w naszej innowacyjnej firmie...'
      },
      {
        id: '3',
        title: 'Brief - Kampania letnia',
        type: 'brief',
        created: '2023-07-10',
        content: 'Brief dla kampanii letniej promującej...'
      }
    ];
    
    // Simulate loading
    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter projects based on active tab
  const filteredProjects = activeTab === 'all' 
    ? projects 
    : projects.filter(project => project.type === activeTab);

  // Get icon based on project type
  const getProjectIcon = (type: string) => {
    switch(type) {
      case 'brief':
        return <FileText className="text-copywrite-teal" />;
      case 'copy':
        return <Newspaper className="text-copywrite-teal-dark" />;
      default:
        return <File className="text-gray-400" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-white shadow-sm animate-pulse">
                  <CardHeader className="h-20 bg-gray-100"></CardHeader>
                  <CardContent className="h-40 bg-gray-50"></CardContent>
                </Card>
              ))}
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
                        {getProjectIcon(project.type)}
                        <div>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription>{formatDate(project.created)}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-600 line-clamp-3">{project.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm text-gray-500 capitalize">
                          {project.type === 'brief' ? 'Brief' : 'Tekst'}
                        </span>
                        <button className="text-sm text-copywrite-teal hover:text-copywrite-teal-dark transition-colors">
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
              <p className="text-gray-500">Nie masz jeszcze żadnych projektów. Stwórz swój pierwszy brief lub tekst!</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Projekty;
