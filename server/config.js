"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.updateOcrApiKey = updateOcrApiKey;
exports.setDefaultOcrMethod = setDefaultOcrMethod;
exports.initializeEnvFromConfig = initializeEnvFromConfig;

// Configuration management for the application
const fs = require("fs");
const path = require("path");

// Debug logging to understand what's happening
console.log('Current working directory:', process.cwd());

// Default configuration
const defaultConfig = {
  ocrApiKeys: {},
  defaultOcrMethod: 'gemini',
  ocrTemplate: 'travel' // Set travel as the default template
};

// Path to the config file - use path.join directly
const configPath = path.join(process.cwd(), 'app-config.json');
console.log('Config path:', configPath);

// Load configuration from file
function loadConfig() {
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
function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
}

// Update OCR API key
function updateOcrApiKey(method, apiKey) {
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
function setDefaultOcrMethod(method) {
  const config = loadConfig();
  config.defaultOcrMethod = method;
  saveConfig(config);
}

// Initialize environment variables from config
function initializeEnvFromConfig() {
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
