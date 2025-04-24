var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { defineConfig, loadEnv } from "vite"; // Import loadEnv
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
// Load env file based on mode and define client-safe variables
export default defineConfig(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var env, _c, _d;
    var _e;
    var mode = _b.mode;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                env = loadEnv(mode, process.cwd(), '');
                _e = {};
                _c = [[
                        react(),
                        runtimeErrorOverlay(),
                        themePlugin()
                    ]];
                if (!(process.env.NODE_ENV !== "production" &&
                    process.env.REPL_ID !== undefined)) return [3 /*break*/, 2];
                return [4 /*yield*/, import("@replit/vite-plugin-cartographer").then(function (m) {
                        return m.cartographer();
                    })];
            case 1:
                _d = [
                    _f.sent()
                ];
                return [3 /*break*/, 3];
            case 2:
                _d = [];
                _f.label = 3;
            case 3: return [2 /*return*/, (_e.plugins = __spreadArray.apply(void 0, _c.concat([(_d), true])),
                    // Define global constants for client-side code
                    _e.define = {
                        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
                        'import.meta.env.VITE_SUPABASE_BUCKET_NAME': JSON.stringify(env.VITE_SUPABASE_BUCKET_NAME),
                        // Add other VITE_ prefixed variables here if needed
                    },
                    _e.resolve = {
                        alias: {
                            "@": path.resolve(__dirname, "client", "src"),
                            "@shared": path.resolve(__dirname, "shared"),
                            "@assets": path.resolve(__dirname, "attached_assets"),
                        },
                    },
                    _e.root = path.resolve(__dirname, "client"),
                    _e.build = {
                        // Output directly to client/dist to align with netlify.toml publish setting
                        outDir: path.resolve(__dirname, "client", "dist"),
                        emptyOutDir: true,
                        // Increase chunk size warning limit to avoid unnecessary warnings
                        chunkSizeWarningLimit: 750,
                        rollupOptions: {
                            output: {
                                manualChunks: {
                                    // UI components chunk
                                    'ui-components': [
                                        '@radix-ui/react-accordion',
                                        '@radix-ui/react-alert-dialog',
                                        '@radix-ui/react-aspect-ratio',
                                        '@radix-ui/react-avatar',
                                        '@radix-ui/react-checkbox',
                                        '@radix-ui/react-collapsible',
                                        '@radix-ui/react-context-menu',
                                        '@radix-ui/react-dialog',
                                        '@radix-ui/react-dropdown-menu',
                                        '@radix-ui/react-hover-card',
                                        '@radix-ui/react-label',
                                        '@radix-ui/react-menubar',
                                        '@radix-ui/react-navigation-menu',
                                        '@radix-ui/react-popover',
                                        '@radix-ui/react-progress',
                                        '@radix-ui/react-radio-group',
                                        '@radix-ui/react-scroll-area',
                                        '@radix-ui/react-select',
                                        '@radix-ui/react-separator',
                                        '@radix-ui/react-slider',
                                        '@radix-ui/react-slot',
                                        '@radix-ui/react-switch',
                                        '@radix-ui/react-tabs',
                                        '@radix-ui/react-toast',
                                        '@radix-ui/react-toggle',
                                        '@radix-ui/react-toggle-group',
                                        '@radix-ui/react-tooltip',
                                        'class-variance-authority',
                                        'clsx',
                                        'tailwind-merge',
                                        'cmdk',
                                        'vaul',
                                        'embla-carousel-react',
                                        'input-otp',
                                        'react-resizable-panels',
                                    ],
                                    // Chart libraries chunk
                                    'chart-libs': [
                                        'chart.js',
                                        'recharts',
                                    ],
                                    // Form handling chunk
                                    'form-libs': [
                                        'react-hook-form',
                                        '@hookform/resolvers',
                                        'zod',
                                        'zod-validation-error',
                                    ],
                                    // Authentication chunk
                                    'auth': [
                                        '@clerk/clerk-react',
                                        '@clerk/clerk-sdk-node',
                                        '@clerk/express',
                                    ],
                                    // Data fetching chunk
                                    'data-fetching': [
                                        '@tanstack/react-query',
                                        '@supabase/supabase-js',
                                    ],
                                    // Date handling chunk
                                    'date-libs': [
                                        'date-fns',
                                        'react-day-picker',
                                    ],
                                    // PDF and document handling
                                    'document-libs': [
                                        'pdf-lib',
                                        '@pdf-lib/fontkit',
                                        'pdf-parse',
                                        'pdfjs-dist',
                                        'exceljs',
                                        'xlsx',
                                        'papaparse',
                                    ],
                                    // React core
                                    'react-vendor': [
                                        'react',
                                        'react-dom',
                                        'react-icons',
                                        'framer-motion',
                                        'wouter',
                                        'zustand',
                                    ],
                                },
                            },
                        },
                    },
                    _e)];
        }
    });
}); });
