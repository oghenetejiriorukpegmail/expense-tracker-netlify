import { useEffect, useState, ChangeEvent } from 'react';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, UploadCloud, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertMileageLogSchema } from '@shared/schema';
import type { MileageLog } from '@shared/schema';

// Form schema for validation within the form component
const formSchema = z.object({
    tripDate: z.date({ required_error: "Trip date is required." }),
    startOdometer: z.preprocess(
        (val: unknown) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
        z.number({ invalid_type_error: "Start odometer must be a number." })
         .positive('Start odometer must be positive')
         .optional()
    ),
    endOdometer: z.preprocess(
        (val: unknown) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
        z.number({ invalid_type_error: "End odometer must be a number." })
         .positive('End odometer must be positive')
         .optional()
    ),
    purpose: z.string().optional(),
    tripId: z.number().int().positive().optional().nullable(),
    startImageUrl: z.string().url().nullable().optional(),
    endImageUrl: z.string().url().nullable().optional(),
}).refine((data: FormData) => {
    if (typeof data.startOdometer === 'number' && typeof data.endOdometer === 'number') {
        return data.endOdometer > data.startOdometer;
    }
    return true;
}, {
    message: "End odometer reading must be greater than start odometer reading",
    path: ["endOdometer"],
});

type FormData = z.infer<typeof formSchema>;

interface ImageUploadResponse {
    success: boolean;
    imageUrl: string;
    reading?: number;
    error?: string;
}

interface ImageState {
  file: File | null;
  url: string | null;
  loading: boolean;
  error: string | null;
}

const initialImageState: ImageState = { file: null, url: null, loading: false, error: null };

interface AddEditMileageLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  mileageLog?: MileageLog | null;
  tripId?: number | null;
}

export default function AddEditMileageLogModal({ isOpen, onClose, mileageLog, tripId }: AddEditMileageLogModalProps) {
  const { toast } = useToast();
  const isEditing = !!mileageLog;

  const [imageStates, setImageStates] = useState<{ start: ImageState; end: ImageState }>({
    start: { ...initialImageState },
    end: { ...initialImageState },
  });

  // Helper to update specific image state
  const updateImageState = (type: 'start' | 'end', updates: Partial<ImageState>) => {
    setImageStates((prev: typeof imageStates) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Default values set in useEffect
  });

  // Reset form and image states when modal opens or data changes
  useEffect(() => {
    if (isOpen) {
        const initialStartUrl = mileageLog?.startImageUrl ?? null;
        const initialEndUrl = mileageLog?.endImageUrl ?? null;

        form.reset({
            tripId: mileageLog?.tripId ?? tripId ?? null,
            tripDate: mileageLog?.tripDate ? new Date(mileageLog.tripDate) : new Date(),
            startOdometer: mileageLog ? parseFloat(mileageLog.startOdometer) : undefined,
            endOdometer: mileageLog ? parseFloat(mileageLog.endOdometer) : undefined,
            purpose: mileageLog?.purpose ?? '',
            startImageUrl: initialStartUrl,
            endImageUrl: initialEndUrl,
        });

        // Reset image states completely
        setImageStates({
            start: { ...initialImageState, url: initialStartUrl },
            end: { ...initialImageState, url: initialEndUrl },
        });
    }
  }, [mileageLog, tripId, form, isOpen]); // Add isOpen dependency

  // Function to handle image upload and OCR
  const handleImageUpload = async (file: File, type: 'start' | 'end') => {
    if (!file) return;

    const odometerField = type === 'start' ? 'startOdometer' : 'endOdometer';
    const imageUrlField = type === 'start' ? 'startImageUrl' : 'endImageUrl';

    updateImageState(type, { loading: true, error: null, file: file });

    const formData = new FormData();
    formData.append('odometerImage', file);

    try {
      const rawResponse = await apiRequest('POST', '/api/mileage-logs/upload-odometer-image', formData);

      if (!rawResponse.ok) {
          let errorData: { error?: string } = {};
          try { errorData = await rawResponse.json(); } catch { /* Ignore parsing error */ }
          throw new Error(errorData.error || rawResponse.statusText || "Image upload failed");
      }

      const response: ImageUploadResponse = await rawResponse.json();

      if (response.success) {
        updateImageState(type, { url: response.imageUrl });
        form.setValue(imageUrlField, response.imageUrl);

        if (response.reading !== undefined) {
          form.setValue(odometerField, response.reading);
          toast({ title: "OCR Success", description: `Odometer reading set to ${response.reading}.` });
        } else {
          toast({ title: "Image Uploaded", description: "Image uploaded, but OCR couldn't extract reading." });
        }
      } else {
        throw new Error(response.error || "Image upload failed");
      }
    } catch (error) {
      console.error(`Failed to upload/process ${type} odometer image:`, error);
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred.";
      updateImageState(type, { error: errorMsg, url: null, file: null }); // Clear URL and file on error
      form.setValue(imageUrlField, null);
      toast({
        title: `Upload Failed (${type})`,
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      updateImageState(type, { loading: false });
    }
  };

  // Handle file input change
  const onFileChange = (event: ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, type);
    }
    event.target.value = ''; // Reset input for re-upload
  };

  // Clear image selection/upload
  const clearImage = (type: 'start' | 'end') => {
      const imageUrlField = type === 'start' ? 'startImageUrl' : 'endImageUrl';
      updateImageState(type, { file: null, url: null, error: null });
      form.setValue(imageUrlField, null);
      // Optionally clear odometer reading:
      // const odometerField = type === 'start' ? 'startOdometer' : 'endOdometer';
      // form.setValue(odometerField, undefined);
  };

  const onSubmit = async (values: FormData) => {
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/mileage-logs/${mileageLog?.id}` : '/api/mileage-logs';

    // Use image URLs from the refactored state
    const startImageUrl = imageStates.start.url;
    const endImageUrl = imageStates.end.url;
    const entryMethod = startImageUrl || endImageUrl ? 'ocr' : 'manual';

    const dataToSend = {
        ...values, // Spread form values
        startImageUrl: startImageUrl,
        endImageUrl: endImageUrl,
        entryMethod: entryMethod,
    };

     // Final validation with the shared schema
     const validationResult = insertMileageLogSchema.safeParse(dataToSend);
     if (!validationResult.success) {
         console.error("Final validation failed:", validationResult.error.flatten());
         toast({
             title: "Validation Error",
             description: validationResult.error.errors[0]?.message || "Please check the form fields for errors.",
             variant: "destructive",
         });
         // Focus logic (simplified)
         const firstErrorPath = validationResult.error.errors[0]?.path[0];
         if (firstErrorPath && typeof firstErrorPath === 'string' && form.control._fields[firstErrorPath as keyof FormData]) {
             form.setFocus(firstErrorPath as keyof FormData);
         } else if (validationResult.error.errors[0]?.path.includes('endOdometer')) {
             form.setFocus('endOdometer');
         }
         return;
     }

    try {
      await apiRequest(method, url, validationResult.data); // Use validated data
      toast({
        title: `Mileage log ${isEditing ? 'updated' : 'added'}`,
        description: `Successfully ${isEditing ? 'updated' : 'added'} the mileage log.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mileage-logs'] });
      onClose();
    } catch (error) {
      console.error("Failed to save mileage log:", error);
      toast({
        title: `Failed to ${isEditing ? 'update' : 'add'} mileage log`,
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: 'destructive',
      });
    }
  };

  // Handle modal state change for controlled component
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Helper function to render odometer input and image upload section
  const renderOdometerSection = (type: 'start' | 'end') => {
    const state = imageStates[type];
    const OdometerField = type === 'start' ? 'startOdometer' : 'endOdometer';
    const ImageUrlField = type === 'start' ? 'startImageUrl' : 'endImageUrl';
    const label = type === 'start' ? 'Start' : 'End';
    const placeholder = type === 'start' ? 'e.g., 12345.6' : 'e.g., 12400.2';

    return (
        <div className="space-y-2">
            {/* Odometer Input */}
            <FormField
                control={form.control}
                name={OdometerField}
                render={({ field }: { field: ControllerRenderProps<FormData, typeof OdometerField> }) => (
                    <FormItem>
                        <FormLabel>{label} Odometer</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.1" placeholder={placeholder}
                                   value={field.value ?? ''}
                                   onChange={(event: ChangeEvent<HTMLInputElement>) => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            {/* Image Upload */}
            <FormItem>
                <FormLabel htmlFor={`${type}OdometerImage`} className="text-sm font-medium">{label} Odometer Image</FormLabel>
                <div className="flex items-center gap-2 flex-wrap"> {/* Added flex-wrap */}
                    <Button type="button" variant="outline" size="sm" className="relative" disabled={state.loading}>
                        {state.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        Upload {label}
                        <Input
                            id={`${type}OdometerImage`}
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => onFileChange(e, type)}
                            disabled={state.loading}
                        />
                    </Button>
                    {state.url && !state.loading && (
                        <div className="flex items-center gap-1">
                            <a href={state.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[100px]" title={state.url}>
                                View Image
                            </a>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:bg-red-100" onClick={() => clearImage(type)} aria-label={`Clear ${type} image`}>
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                {state.error && <p className="text-sm font-medium text-destructive">{state.error}</p>}
                {/* Display URL from form state for confirmation */}
                 <FormField
                      control={form.control}
                      name={ImageUrlField}
                      render={({ field }: { field: ControllerRenderProps<FormData, typeof ImageUrlField> }) => (
                          field.value ? <p className="text-xs text-muted-foreground mt-1 truncate" title={field.value}>URL: {field.value.substring(0, 30)}...</p> : null
                      )}
                    />
            </FormItem>
        </div>
    );
};


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Mileage Log' : 'Add New Mileage Log'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details of your mileage log.' : 'Enter details or upload odometer images for automatic reading.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2"> {/* Added scroll */}
            {/* Trip Date */}
            <FormField
              control={form.control}
              name="tripDate"
              render={({ field }: { field: ControllerRenderProps<FormData, "tripDate"> }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Trip Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Odometer Readings and Image Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderOdometerSection('start')}
              {renderOdometerSection('end')}
            </div>

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }: { field: ControllerRenderProps<FormData, "purpose"> }) => (
                <FormItem>
                  <FormLabel>Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Client meeting, Site visit" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden Trip ID - Not strictly needed in form if passed directly */}
            {/* <FormField control={form.control} name="tripId" render={({ field }) => <Input type="hidden" {...field} />} /> */}

            <DialogFooter className="pt-4"> {/* Added padding top */}
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || imageStates.start.loading || imageStates.end.loading}>
                {(form.formState.isSubmitting || imageStates.start.loading || imageStates.end.loading)
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    : (isEditing ? 'Update Log' : 'Add Log')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}