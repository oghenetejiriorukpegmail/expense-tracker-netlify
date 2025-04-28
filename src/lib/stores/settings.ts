import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// --- Theme Store ---
type Theme = 'light' | 'dark' | 'system';

const storedTheme = browser ? localStorage.getItem('theme') as Theme | null : 'system';
const initialTheme: Theme = storedTheme || 'system';

export const theme = writable<Theme>(initialTheme);

theme.subscribe(value => {
  if (browser) {
    localStorage.setItem('theme', value);
    // Apply theme class to documentElement
    document.documentElement.classList.remove('light', 'dark');
    if (value === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(systemPrefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(value);
    }
  }
});

export function toggleTheme() {
  theme.update(currentTheme => {
    if (currentTheme === 'light') return 'dark';
    if (currentTheme === 'dark') return 'system';
    return 'light'; // Cycle through light -> dark -> system -> light
  });
}

// --- OCR Settings Store ---
// TODO: Load initial values from API/backend if they are persisted per user
// For now, use localStorage or defaults

type OcrMethod = 'gemini' | 'openai' | 'claude' | 'openrouter' | string; // Allow string for flexibility
type OcrTemplate = 'travel' | 'general' | string; // Allow string

const storedOcrMethod = browser ? localStorage.getItem('ocrMethod') as OcrMethod | null : 'gemini';
const storedOcrApiKey = browser ? localStorage.getItem('ocrApiKey') : '';
const storedOcrTemplate = browser ? localStorage.getItem('ocrTemplate') as OcrTemplate | null : 'general'; // Default to general

export const ocrMethod = writable<OcrMethod>(storedOcrMethod || 'gemini');
export const ocrApiKey = writable<string>(storedOcrApiKey || '');
export const ocrTemplate = writable<OcrTemplate>(storedOcrTemplate || 'general');

ocrMethod.subscribe(value => {
  if (browser) localStorage.setItem('ocrMethod', value);
});
ocrApiKey.subscribe(value => {
  if (browser) localStorage.setItem('ocrApiKey', value);
});
ocrTemplate.subscribe(value => {
  if (browser) localStorage.setItem('ocrTemplate', value);
});

// Function to update settings (can be called after successful API save)
export function updateOcrSettings(method: OcrMethod, key: string | null, template: OcrTemplate) {
    ocrMethod.set(method);
    ocrApiKey.set(key || '');
    ocrTemplate.set(template);
}

// TODO: Add other settings as needed (e.g., default currency)