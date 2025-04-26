// Configuration management for the application
// Import modules with ES module syntax
import fs from 'fs';
import * as path from 'path';

// Debug logging to understand what's happening
console.log('Current working directory:', process.cwd());

// Define the configuration interface
interface AppConfig {
  ocrApiKeys: {
    gemini?: string;
    openai?: string;
    claude?: string;
    openrouter?: string;
  };
  defaultOcrMethod: string;
  ocrTemplate?: string;
}

// Default configuration
const defaultConfig: AppConfig = {
  ocrApiKeys: {},
  defaultOcrMethod: 'gemini',
  ocrTemplate: 'travel' // Set travel as the default template
};

// Path to the config file - use path.join directly with require-style import
const configPath = path.join(process.cwd(), 'app-config.json');
console.log('Config path:', configPath);

// Load configuration from file
export function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
  
  // If file doesn't exist or there's an error, return default config
  return { ...defaultConfig };
}

// Save configuration to file
export function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
}

// Update OCR API key
export function updateOcrApiKey(method: string, apiKey: string): void {
  const config = loadConfig();
  
  if (!config.ocrApiKeys) {
    config.ocrApiKeys = {};
  }
  
  // Update the specific API key
  switch (method) {
    case 'gemini':
    case 'openai':
    case 'claude':
    case 'openrouter':
      config.ocrApiKeys[method] = apiKey;
      break;
    default:
      console.warn(`Unknown OCR method: ${method}`);
      return;
  }
  
  // Save the updated configuration
  saveConfig(config);
  
  // Also update the environment variable for the current process
  const envVarName = `${method.toUpperCase()}_API_KEY`;
  process.env[envVarName] = apiKey;
  console.log(`Updated ${envVarName} environment variable`);
}

// Set default OCR method
export function setDefaultOcrMethod(method: string): void {
  const config = loadConfig();
  config.defaultOcrMethod = method;
  saveConfig(config);
}

// Initialize environment variables from config
export function initializeEnvFromConfig(): void {
  const config = loadConfig();
  
  // Set OCR API keys in environment variables
  if (config.ocrApiKeys) {
    Object.entries(config.ocrApiKeys).forEach(([method, apiKey]) => {
      if (apiKey) {
        const envVarName = `${method.toUpperCase()}_API_KEY`;
        process.env[envVarName] = apiKey;
        console.log(`Set ${envVarName} from configuration`);
      }
    });
  }
}