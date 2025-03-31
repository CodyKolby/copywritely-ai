
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
      <TabsList>
        <TabsTrigger value="all">Wszystkie</TabsTrigger>
        <TabsTrigger value="brief">Briefy</TabsTrigger>
        <TabsTrigger value="script">Teksty</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ProjectFilters;
