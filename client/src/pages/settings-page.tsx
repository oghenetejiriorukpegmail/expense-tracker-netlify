import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/sidebar";
import { useSettingsStore, OcrTemplate } from "@/lib/store";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import AnimatedPage from "@/components/animated-page";

// --- Schemas ---
const ocrSettingsSchema = z.object({
  ocrMethod: z.string(),
  ocrApiKey: z.string().optional(),
  ocrTemplate: z.enum(['travel']), // Only travel template allowed
});

type OcrSettingsFormData = z.infer<typeof ocrSettingsSchema>;

// --- Appearance Settings Component ---
const AppearanceSettings = () => {
  const { theme, toggleTheme } = useSettingsStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Customize how the application looks.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-md font-medium">Dark Mode</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle theme.</p>
          </div>
          <Button variant="outline" onClick={toggleTheme}>
            {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- OCR Configuration Form Component ---
interface OcrConfigFormProps {
  ocrForm: ReturnType<typeof useForm<OcrSettingsFormData>>;
  onOcrSubmit: (values: OcrSettingsFormData) => Promise<void>;
  testOcrSettings: () => Promise<void>;
  isSubmitting: boolean;
}

const OcrConfigForm = ({ ocrForm, onOcrSubmit, testOcrSettings, isSubmitting }: OcrConfigFormProps) => {
  return (
    <Form {...ocrForm}>
      <form onSubmit={ocrForm.handleSubmit(onOcrSubmit)} className="space-y-6">
        <FormField
          control={ocrForm.control}
          name="ocrMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OCR Method</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === "tesseract") { ocrForm.setValue("ocrApiKey", ""); }
                }}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Select OCR method" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="gemini">Google Gemini (Recommended)</SelectItem>
                  <SelectItem value="openai">OpenAI Vision</SelectItem>
                  <SelectItem value="claude">Anthropic Claude</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the OCR method for data extraction.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={ocrForm.control}
          name="ocrApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl><Input type="password" placeholder="Enter API key" {...field} value={field.value || ""} /></FormControl>
              <FormDescription>{`Enter your ${ocrForm.watch("ocrMethod")} API key.`}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={ocrForm.control}
          name="ocrTemplate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OCR Data Extraction Template</FormLabel>
              <Select value={field.value} onValueChange={(value: OcrTemplate) => field.onChange(value)}>
                <FormControl><SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger></FormControl>
                <SelectContent><SelectItem value="travel">Travel Expenses</SelectItem></SelectContent>
              </Select>
              <FormDescription>Choose a template to guide AI extraction.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex space-x-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save OCR Settings"}
          </Button>
          <Button type="button" variant="outline" onClick={testOcrSettings} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</> : "Test OCR"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

// --- OCR Verification Component ---
interface OcrVerificationProps {
  ocrForm: ReturnType<typeof useForm<OcrSettingsFormData>>;
  isSubmitting: boolean;
}

const OcrVerification = ({ ocrForm, isSubmitting }: OcrVerificationProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "loading" | "success" | "error">("none");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [extractedData, setExtractedData] = useState<Record<string, string | number | null | undefined>>({});

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const values = ocrForm.getValues();
    if (!values.ocrApiKey?.trim()) {
      toast({ title: "API Key Required", description: `Enter ${values.ocrMethod} API key and save.`, variant: "destructive" });
      return;
    }

    setVerificationStatus("loading");
    setVerificationMessage("Processing receipt...");
    setExtractedData({});

    const formData = new FormData();
    formData.append("receipt", file);
    formData.append("template", values.ocrTemplate);

    try {
      // Using fetch directly as apiRequest might not handle FormData response well for this specific case
      const response = await fetch("/api/ocr/process", { method: "POST", body: formData });
      const data = await response.json();

      if (data.success) {
        setExtractedData(data.data || {});
        const hasData = data.data && Object.values(data.data).some(val => val && (typeof val === 'string' ? val.trim() !== '' : true));
        setVerificationStatus("success");
        setVerificationMessage(data.pdfMessage || (hasData ? "Receipt processed successfully!" : "Processed, but limited data extracted."));
      } else {
        setVerificationStatus("error");
        setVerificationMessage(data.error || "Failed to process receipt.");
      }
    } catch (error) {
      setVerificationStatus("error");
      setVerificationMessage(error instanceof Error ? error.message : "Failed to process receipt");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-2">Verify OCR Settings</h3>
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
        <div className="flex flex-col items-center justify-center space-y-3">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" onChange={handleFileChange} className="hidden" />

          {verificationStatus === "none" && (
            <>
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="text-sm text-center text-gray-500">Upload receipt to verify settings.</p>
              <Button type="button" variant="outline" onClick={triggerFileInput} disabled={isSubmitting} className="mt-2">Upload for Verification</Button>
            </>
          )}
          {verificationStatus === "loading" && <><Loader2 className="h-8 w-8 text-primary animate-spin" /><p className="text-sm text-center text-gray-500">{verificationMessage}</p></>}
          {verificationStatus === "success" && (
            <>
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="text-sm text-center text-green-500 font-medium">{verificationMessage}</p>
              {Object.keys(extractedData).length > 0 && (
                <div className="w-full mt-4 border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="px-4 py-2 text-left">Field</th><th className="px-4 py-2 text-left">Value</th></tr></thead>
                    <tbody className="divide-y">
                      {Object.entries(extractedData).map(([key, value]) => (
                        <tr key={key} className="bg-white dark:bg-gray-800"><td className="px-4 py-2 font-medium capitalize">{key}</td><td className="px-4 py-2">{value?.toString() || "Not detected"}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button type="button" variant="outline" onClick={triggerFileInput} className="mt-4">Try Another</Button>
            </>
          )}
          {verificationStatus === "error" && (
            <>
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-center text-red-500">{verificationMessage}</p>
              <Button type="button" variant="outline" onClick={triggerFileInput} className="mt-2">Try Again</Button>
            </>
          )}
        </div>
      </div>
      {/* OCR Methods Info */}
       <div className="mt-6 w-full">
          <h3 className="text-sm font-medium mb-2">OCR Methods Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-sm">
            <div><p className="font-medium">OpenAI Vision</p><p className="text-gray-500 dark:text-gray-400">Requires API key with billing.</p></div>
            <div className="bg-primary/5 p-2 rounded-md"><p className="font-medium">Google Gemini (Recommended)</p><p className="text-gray-500 dark:text-gray-400">Excellent receipt processing. Requires Gemini API key.</p></div>
            <div><p className="font-medium">Anthropic Claude</p><p className="text-gray-500 dark:text-gray-400">Claude model with vision.</p></div>
          </div>
        </div>
    </div>
  );
};


// --- Main Settings Page Component ---
export default function SettingsPage() {
  const { toast } = useToast();
  const { ocrMethod, ocrApiKey, ocrTemplate, setOcrMethod, setOcrApiKey, setOcrTemplate } = useSettingsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ocrForm = useForm<OcrSettingsFormData>({
    resolver: zodResolver(ocrSettingsSchema),
    defaultValues: {
      ocrMethod: ocrMethod || "gemini",
      ocrApiKey: ocrApiKey || "",
      ocrTemplate: ocrTemplate || "travel",
    },
  });

  // Update form defaults if store values change
  useEffect(() => {
    ocrForm.reset({
      ocrMethod: ocrMethod || "gemini",
      ocrApiKey: ocrApiKey || "",
      ocrTemplate: ocrTemplate || "travel",
    });
  }, [ocrMethod, ocrApiKey, ocrTemplate, ocrForm]);


  async function onOcrSubmit(values: OcrSettingsFormData) {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/update-env", {
        ocrMethod: values.ocrMethod,
        apiKey: values.ocrApiKey,
        ocrTemplate: values.ocrTemplate,
      });
      setOcrMethod(values.ocrMethod);
      setOcrApiKey(values.ocrApiKey || null);
      setOcrTemplate(values.ocrTemplate);
      toast({ title: "Settings updated", description: "OCR settings saved." });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function testOcrSettings() {
    const values = ocrForm.getValues();
    setIsSubmitting(true);
    try {
      // Assuming apiRequest returns parsed JSON or throws on error
      const data = await apiRequest("POST", "/api/test-ocr", {
        method: values.ocrMethod,
        apiKey: values.ocrApiKey,
      });
      toast({
        title: "OCR Test Result",
        description: data.success ? "OCR configuration tested successfully!" : `Test failed: ${data.message}`,
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({ title: "OCR Test Failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <AnimatedPage className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="appearance" className="space-y-6">
          <TabsList>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="ocr">OCR Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance"><AppearanceSettings /></TabsContent>

          <TabsContent value="ocr">
            <Card>
              <CardHeader>
                <CardTitle>OCR Configuration</CardTitle>
                <CardDescription>Configure OCR settings for receipt processing.</CardDescription>
              </CardHeader>
              <CardContent>
                <OcrConfigForm
                  ocrForm={ocrForm}
                  onOcrSubmit={onOcrSubmit}
                  testOcrSettings={testOcrSettings}
                  isSubmitting={isSubmitting}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-start border-t pt-6 space-y-6">
                 <OcrVerification ocrForm={ocrForm} isSubmitting={isSubmitting} />
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedPage>
    </div>
  );
}
