
'use client';

import * as React from 'react';
import { getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/actions';
import type { MenuItem } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, PlusCircle, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MenuForm } from '@/components/menu/menu-form';
import { useToast } from '@/hooks/use-toast';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { menuCategories } from '@/lib/data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MenuManagementPage() {
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  
  const [editingRowId, setEditingRowId] = React.useState<number | null>(null);
  const [editedData, setEditedData] = React.useState<Partial<MenuItem>>({});

  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    const items = await getMenuItems();
    setMenuItems(items);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchItems();
  }, []);

  const handleFormSubmit = async (values: Omit<MenuItem, 'id'>) => {
    try {
      // This is for the "Add New Item" dialog
      await createMenuItem(values);
      toast({ title: 'Success', description: 'Menu item added successfully.' });
      setIsFormOpen(false);
      fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add new menu item.',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenuItem(id);
      toast({ title: 'Success', description: 'Menu item deleted successfully.' });
      fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete menu item.',
      });
    }
  };
  
  const handleEditClick = (item: MenuItem) => {
    setEditingRowId(item.id);
    setEditedData(item);
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  const handleSaveEdit = async () => {
    if (!editingRowId || !editedData.name || !editedData.price || !editedData.category) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name, price, and category cannot be empty.',
      });
      return;
    }

    try {
      await updateMenuItem(editingRowId, {
        name: editedData.name,
        price: Number(editedData.price),
        category: editedData.category,
        portion: editedData.portion,
      });
      toast({ title: 'Success', description: 'Menu item updated successfully.' });
      setEditingRowId(null);
      setEditedData({});
      fetchItems();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update menu item.',
      });
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof MenuItem) => {
    setEditedData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectChange = (value: string, field: keyof MenuItem) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit, or remove menu items.</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <MenuForm
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-grow overflow-auto border rounded-lg">
        {loading ? (
          <p className="text-center p-8">Loading menu...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Portion</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  {editingRowId === item.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editedData.name || ''}
                          onChange={(e) => handleInputChange(e, 'name')}
                          onKeyDown={handleKeyDown}
                          autoFocus
                        />
                      </TableCell>
                      <TableCell>
                         <Select value={editedData.category} onValueChange={(value) => handleSelectChange(value, 'category')}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select..." />
                           </SelectTrigger>
                           <SelectContent>
                             {menuCategories.map((category) => (
                               <SelectItem key={category} value={category}>{category}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editedData.portion || ''}
                          onChange={(e) => handleInputChange(e, 'portion')}
                          onKeyDown={handleKeyDown}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={editedData.price || ''}
                          onChange={(e) => handleInputChange(e, 'price')}
                          onKeyDown={handleKeyDown}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                           <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                             <Save className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                             <X className="h-4 w-4" />
                           </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.portion || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        Rs.{item.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the menu item.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

