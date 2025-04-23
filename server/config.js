"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.updateOcrApiKey = updateOcrApiKey;
exports.setDefaultOcrMethod = setDefaultOcrMethod;
exports.initializeEnvFromConfig = initializeEnvFromConfig;
// Configuration management for the application
var fs_1 = require("fs");
var path_1 = require("path");
// Default configuration
var defaultConfig = {
    ocrApiKeys: {},
    defaultOcrMethod: 'gemini',
    ocrTemplate: 'travel' // Set travel as the default template
};
// Path to the config file
var configPath = path_1.default.join(process.cwd(), 'app-config.json');
// Load configuration from file
function loadConfig() {
    try {
        if (fs_1.default.existsSync(configPath)) {
            var configData = fs_1.default.readFileSync(configPath, 'utf8');
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
function saveConfig(config) {
    try {
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Error saving configuration:', error);
    }
}
// Update OCR API key
function updateOcrApiKey(method, apiKey) {
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
function setDefaultOcrMethod(method) {
    var config = loadConfig();
    config.defaultOcrMethod = method;
    saveConfig(config);
}
// Initialize environment variables from config
function initializeEnvFromConfig() {
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
