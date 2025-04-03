
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  navItems: Array<{ path: string, label: string }>;
  currentPath: string;
}

export const MobileMenu = ({ navItems, currentPath }: MobileMenuProps) => {
  return (
    <div className="md:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6 text-copywrite-teal" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {navItems.map((item) => (
            <DropdownMenuItem key={item.path} asChild>
              <Link 
                to={item.path} 
                className={cn(
                  "w-full", 
                  currentPath === item.path ? "text-copywrite-teal" : ""
                )}
              >
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
