import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type ThemeType = 'colorful' | 'accessible';

// Define context type
interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'colorful', // Default to colorful theme
  toggleTheme: () => {}, // Empty function as placeholder
});

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get initial theme from localStorage or default to 'colorful'
  const [theme, setTheme] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as ThemeType) || 'colorful';
  });

  // Toggle between themes
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'colorful' ? 'accessible' : 'colorful';
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme class to document body
  useEffect(() => {
    document.body.classList.remove('theme-colorful', 'theme-accessible');
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};