import { create } from 'zustand';

type ThemeType = 'light' | 'dark';

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const useThemeStore = create<ThemeStore>((set) => {
  const matchDark = window.matchMedia('(prefers-color-scheme: dark)');

  const updateTheme = () => {
    set({ theme: matchDark.matches ? 'dark' : 'light' });
  };

  // Listen for changes in system theme
  matchDark.addEventListener('change', updateTheme);

  // Initialize with the current system theme
  return {
    theme: matchDark.matches ? 'dark' : 'light',
    setTheme: (theme) => set({ theme }),
  };
});

export { useThemeStore };