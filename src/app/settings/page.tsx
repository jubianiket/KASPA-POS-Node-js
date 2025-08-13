
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from '@/hooks/use-toast';
import { getSettings, updateSettings } from '@/lib/actions';
import type { RestaurantSettings } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const themeColors = [
  { name: 'Orange', hsl: '29 100% 50%' },
  { name: 'Blue', hsl: '221 83% 53%' },
  { name: 'Green', hsl: '142 71% 45%' },
  { name: 'Purple', hsl: '262 84% 58%' },
];

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<Partial<RestaurantSettings>>({});
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const applyTheme = (theme: Partial<RestaurantSettings>) => {
    if (theme.dark_mode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (theme.theme_color) {
      document.documentElement.style.setProperty('--primary', theme.theme_color);
    }
  };

  React.useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const fetchedSettings = await getSettings();
      if (fetchedSettings) {
        setSettings(fetchedSettings);
        applyTheme(fetchedSettings);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSwitchChange = (checked: boolean, id: keyof RestaurantSettings) => {
    const newSettings = { ...settings, [id]: checked };
    setSettings(newSettings);
    if (id === 'dark_mode') {
      applyTheme(newSettings);
    }
  };

  const handleThemeColorChange = (hsl: string) => {
    const newSettings = { ...settings, theme_color: hsl };
    setSettings(newSettings);
    applyTheme(newSettings);
  }

  const handleSaveChanges = async (tab: 'restaurant' | 'tax' | 'appearance') => {
    try {
      await updateSettings(settings);
      toast({
        title: "Settings Saved",
        description: `Your ${tab} settings have been saved successfully.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save ${tab} settings.`,
      });
    }
  };

  if (loading) {
    return (
       <div className="p-4 lg:p-6 h-full">
        <header className="mb-6">
          <h1 className="text-3xl font-headline font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your restaurant and POS settings.</p>
        </header>
        <div className="space-y-4">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 h-full">
      <header className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your restaurant and POS settings.</p>
      </header>
      <Tabs defaultValue="restaurant" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="restaurant">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Restaurant Details</CardTitle>
              <CardDescription>
                Update your restaurant's information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_name">Restaurant Name</Label>
                <Input id="restaurant_name" value={settings.restaurant_name || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" value={settings.address || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={settings.phone || ''} onChange={handleInputChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges('restaurant')}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Tax Settings</CardTitle>
              <CardDescription>
                Configure tax rates for your sales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border">
                <Label htmlFor="tax_enabled" className="flex flex-col space-y-1">
                  <span>Enable Tax Calculation</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Automatically calculate and add tax to orders.
                  </span>
                </Label>
                <Switch 
                    id="tax_enabled" 
                    checked={settings.tax_enabled || false} 
                    onCheckedChange={(checked) => handleSwitchChange(checked, 'tax_enabled')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
                <Input id="tax_rate" type="number" value={settings.tax_rate || ''} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID Number</Label>
                <Input id="tax_id" value={settings.tax_id || ''} onChange={handleInputChange} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges('tax')}>Save Tax Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of your POS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-center justify-between space-x-2 p-2 rounded-lg border">
                <Label htmlFor="dark_mode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable a darker color scheme for the interface.
                  </span>
                </Label>
                <Switch 
                  id="dark_mode" 
                  checked={settings.dark_mode || false}
                  onCheckedChange={(checked) => handleSwitchChange(checked, 'dark_mode')}
                />
              </div>
               <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                    {themeColors.map((color) => (
                      <Button
                        key={color.name}
                        variant="outline"
                        className={cn(
                          "h-10 w-10 p-0",
                          settings.theme_color === color.hsl && 'border-2 border-foreground'
                        )}
                        onClick={() => handleThemeColorChange(color.hsl)}
                      >
                        <div
                          className="h-full w-full rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `hsl(${color.hsl})` }}
                        >
                          {settings.theme_color === color.hsl && <Check className="h-5 w-5 text-white" />}
                        </div>
                      </Button>
                    ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => handleSaveChanges('appearance')}>Save Appearance</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
