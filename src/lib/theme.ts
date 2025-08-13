
export type ThemeColors = {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
};

// Helper function to parse HSL string
function parseHsl(hsl: string): [number, number, number] {
  const [h, s, l] = hsl.split(' ').map(val => parseInt(val, 10));
  return [h, s, l];
}

// Function to generate a full theme from a primary color
export function generateTheme(primaryHsl: string): ThemeColors {
  const [h, s, l] = parseHsl(primaryHsl);

  // Generate a complementary color for the accent
  const accentHue = (h + 180) % 360;

  return {
    // Base colors
    background: `${h} 20% 94%`,
    foreground: `${h} 10% 10%`,
    
    // Card
    card: `${h} 20% 96%`,
    'card-foreground': `${h} 10% 10%`,

    // Popover
    popover: `${h} 20% 96%`,
    'popover-foreground': `${h} 10% 10%`,

    // Primary
    primary: `${h} ${s}% ${l}%`,
    'primary-foreground': `${h} ${s}% ${l > 50 ? '10%' : '90%'}`,

    // Secondary
    secondary: `${h} 15% 88%`,
    'secondary-foreground': `${h} 10% 15%`,
    
    // Muted
    muted: `${h} 15% 90%`,
    'muted-foreground': `${h} 10% 40%`,
    
    // Accent
    accent: `${accentHue} 40% 50%`,
    'accent-foreground': `${accentHue} 20% 95%`,

    // Destructive (usually kept consistent)
    destructive: `0 84% 60%`,
    'destructive-foreground': `0 0% 98%`,

    // Border, Input, Ring
    border: `${h} 15% 85%`,
    input: `${h} 15% 88%`,
    ring: `${h} ${s}% ${l}%`,
  };
}
