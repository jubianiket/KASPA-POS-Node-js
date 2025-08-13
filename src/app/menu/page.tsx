import { menuItems, menuCategories } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default function MenuBoardPage() {
  return (
    <div className="bg-background min-h-screen p-6 md:p-10 lg:p-16">
      <header className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">SwiftServe</h1>
        <p className="font-headline text-2xl md:text-3xl mt-2 text-accent">Our Menu</p>
      </header>
      
      <main className="space-y-12">
        {menuCategories.map(category => {
          const items = menuItems.filter(item => item.category === category);
          if (items.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="font-headline text-4xl font-bold text-center mb-8">{category}</h2>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 max-w-4xl mx-auto">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-baseline gap-4">
                    <h3 className="font-body text-xl font-bold">{item.name}</h3>
                    <div className="flex-grow border-b border-dashed border-muted-foreground/50 mx-2"></div>
                    <p className="font-body text-xl font-bold text-primary">₹{item.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="text-center mt-16">
        <Separator className="max-w-xs mx-auto mb-4"/>
        <p className="text-muted-foreground">Thank you for dining with us!</p>
      </footer>
    </div>
  );
}
