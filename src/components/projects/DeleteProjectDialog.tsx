
import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
}

const DeleteProjectDialog: React.FC<DeleteProjectDialogProps> = ({
  open,
  onOpenChange,
  onDelete,
  isDeleting
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white rounded-lg border border-gray-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-gray-900">Czy na pewno chcesz usunąć ten projekt?</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Ta akcja jest nieodwracalna. Po usunięciu projektu nie będzie można go przywrócić.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white"
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
  );
};

export default DeleteProjectDialog;
