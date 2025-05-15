// import { useTheme } from '../components/ThemeContext';
import { useTheme } from '@react-navigation/native';
import { lightTheme, darkTheme, ThemeType } from '../styles/themes';


export function useThemeColor(
  props: { light?: keyof ThemeType; dark?: keyof ThemeType },
  colorName: keyof ThemeType
): string {
  const theme = useTheme();
  const themeMode = theme.dark ? 'dark' : 'light';
  const currentTheme = themeMode === 'dark' ? darkTheme : lightTheme;

  if (props[themeMode] && currentTheme[props[themeMode]]) {
    return currentTheme[props[themeMode]];
  } else if (currentTheme[colorName]) {
    return currentTheme[colorName];
  } else {
    return themeMode === 'dark' ? darkTheme.text : lightTheme.text;
  }
}