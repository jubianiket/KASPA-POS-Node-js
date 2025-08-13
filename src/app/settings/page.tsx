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

export default function SettingsPage() {
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
                <Label htmlFor="name">Restaurant Name</Label>
                <Input id="name" defaultValue="SwiftServe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" defaultValue="123 Culinary Lane, Foodie City, 10101" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="(123) 456-7890" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
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
                <Label htmlFor="tax-enabled" className="flex flex-col space-y-1">
                  <span>Enable Tax Calculation</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Automatically calculate and add tax to orders.
                  </span>
                </Label>
                <Switch id="tax-enabled" defaultChecked />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                <Input id="tax-rate" type="number" defaultValue="5.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID Number</Label>
                <Input id="tax-id" defaultValue="TAX-123456789" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Tax Settings</Button>
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
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Enable a darker color scheme for the interface.
                  </span>
                </Label>
                <Switch id="dark-mode" />
              </div>
               <div className="space-y-2">
                <Label>Theme Color</Label>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-10 w-10 p-0 border-2 border-primary">
                        <div className="h-full w-full rounded-md bg-primary" />
                    </Button>
                    <Button variant="outline" className="h-10 w-10 p-0">
                        <div className="h-full w-full rounded-md" style={{backgroundColor: '#3B82F6'}} />
                    </Button>
                    <Button variant="outline" className="h-10 w-10 p-0">
                        <div className="h-full w-full rounded-md" style={{backgroundColor: '#16A34A'}} />
                    </Button>
                     <Button variant="outline" className="h-10 w-10 p-0">
                        <div className="h-full w-full rounded-md" style={{backgroundColor: '#7C3AED'}} />
                    </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Appearance</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
