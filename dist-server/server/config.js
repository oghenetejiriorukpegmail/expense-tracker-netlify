var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
// Configuration management for the application
// Import modules with ES module syntax
import fs from 'fs';
import * as path from 'path';
// Debug logging to understand what's happening
console.log('Current working directory:', process.cwd());
// Default configuration
var defaultConfig = {
    ocrApiKeys: {},
    defaultOcrMethod: 'gemini',
    ocrTemplate: 'travel' // Set travel as the default template
};
// Path to the config file - use path.join directly with require-style import
var configPath = path.join(process.cwd(), 'app-config.json');
console.log('Config path:', configPath);
// Load configuration from file
export function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            var configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
    }
    catch (error) {
        console.error('Error loading configuration:', error);
    }
    // If file doesn't exist or there's an error, return default config
    return __assign({}, defaultConfig);
}
// Save configuration to file
export function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Error saving configuration:', error);
    }
}
// Update OCR API key
export function updateOcrApiKey(method, apiKey) {
    var config = loadConfig();
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
            console.warn("Unknown OCR method: ".concat(method));
            return;
    }
    // Save the updated configuration
    saveConfig(config);
    // Also update the environment variable for the current process
    var envVarName = "".concat(method.toUpperCase(), "_API_KEY");
    process.env[envVarName] = apiKey;
    console.log("Updated ".concat(envVarName, " environment variable"));
}
// Set default OCR method
export function setDefaultOcrMethod(method) {
    var config = loadConfig();
    config.defaultOcrMethod = method;
    saveConfig(config);
}
// Initialize environment variables from config
export function initializeEnvFromConfig() {
    var config = loadConfig();
    // Set OCR API keys in environment variables
    if (config.ocrApiKeys) {
        Object.entries(config.ocrApiKeys).forEach(function (_a) {
            var method = _a[0], apiKey = _a[1];
            if (apiKey) {
                var envVarName = "".concat(method.toUpperCase(), "_API_KEY");
                process.env[envVarName] = apiKey;
                console.log("Set ".concat(envVarName, " from configuration"));
            }
        });
    }
}
