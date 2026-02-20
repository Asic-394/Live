import { useMemo } from 'react';
import { useStore } from '../state/store';
import { getThemeConfig } from '../utils/materials';
import type { ThemeConfig } from '../utils/materials';

/**
 * Hook to access scene theme configuration
 * Automatically updates when theme changes in store
 */
export function useSceneTheme(): ThemeConfig {
  const theme = useStore((state) => state.theme);
  
  return useMemo(() => getThemeConfig(theme), [theme]);
}
