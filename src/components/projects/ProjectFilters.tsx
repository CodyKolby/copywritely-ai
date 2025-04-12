
import React from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ProjectFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ activeTab, onTabChange }) => {
  return (
    <Tabs defaultValue="all" value={activeTab} onValueChange={onTabChange} className="mb-8">
      <TabsList className="w-full flex flex-wrap">
        <TabsTrigger value="all" className="flex-1">Wszystkie</TabsTrigger>
        <TabsTrigger value="ad" className="flex-1">Reklamy internetowe</TabsTrigger>
        <TabsTrigger value="email" className="flex-1">Maile marketingowe</TabsTrigger>
        <TabsTrigger value="social" className="flex-1">Posty na social media</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ProjectFilters;
