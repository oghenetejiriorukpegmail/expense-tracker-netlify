<script lang="ts">
  import { theme, toggleTheme } from '$lib/stores/settings';
  import OcrConfigForm from '$lib/components/settings/OcrConfigForm.svelte'; // Import the OCR form component
  // Assuming shadcn-svelte components
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
  import { Sun, Moon, Laptop } from 'lucide-svelte';

  // --- Appearance Settings ---
  function getThemeButtonLabel(currentTheme: string): string {
      if (currentTheme === 'light') return 'Switch to Dark';
      if (currentTheme === 'dark') return 'Use System';
      return 'Switch to Light';
  }

  function getThemeIcon(currentTheme: string) {
      if (currentTheme === 'light') return Sun;
      if (currentTheme === 'dark') return Moon;
      return Laptop; // System
  }

  // --- OCR Settings (Placeholders for verification/processing) ---
  // TODO: Import OCR verification/processing components

</script>

<div class="p-4 md:p-8">
  <h1 class="text-2xl font-bold mb-6">Settings</h1>

  <Tabs defaultValue="appearance" class="space-y-6">
    <TabsList>
      <TabsTrigger value="appearance">Appearance</TabsTrigger>
      <TabsTrigger value="ocr">OCR Configuration</TabsTrigger>
      <!-- TODO: Add other settings tabs (Profile, Notifications, etc.) -->
    </TabsList>

    <!-- Appearance Tab -->
    <TabsContent value="appearance">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex justify-between items-center p-4 border rounded-md">
            <div>
              <h3 class="text-md font-medium">Theme</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Current: <span class="capitalize">{$theme}</span>
              </p>
            </div>
            <Button variant="outline" on:click={toggleTheme} class="w-40 justify-start">
               <svelte:component this={getThemeIcon($theme)} class="mr-2 h-4 w-4" />
               {getThemeButtonLabel($theme)}
            </Button>
          </div>
          <!-- TODO: Add other appearance settings like font size, etc. -->
        </CardContent>
      </Card>
    </TabsContent>

    <!-- OCR Configuration Tab -->
    <TabsContent value="ocr">
       <Card>
         <CardHeader>
           <CardTitle>OCR Configuration</CardTitle>
           <CardDescription>Configure OCR settings for receipt processing.</CardDescription>
         </CardHeader>
         <CardContent>
           <!-- Integrate the OCR Config Form -->
           <OcrConfigForm />
         </CardContent>
         <CardFooter class="flex flex-col items-start border-t pt-6 space-y-6">
            <p class="text-gray-500">OCR verification section coming soon...</p>
            <!-- TODO: Implement OcrVerification component -->
            <p class="text-gray-500">Process pending tasks section coming soon...</p>
             <!-- TODO: Implement OCRProcessor component -->
         </CardFooter>
       </Card>
    </TabsContent>

  </Tabs>
</div>