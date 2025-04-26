import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@clerk/clerk-react"; // Import Clerk useAuth
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";
import AnimatedPage from "@/components/animated-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

// Schema for profile update form validation
const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().email("Invalid email address"),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

// Password changes are handled by Clerk UI/API

export default function ProfilePage() {
  const { toast } = useToast();
  const { getToken, userId } = useAuth(); // Get getToken and userId from Clerk

  // Fetch profile data with retry and error handling
  const { data: profile, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      try {
        const token = await getToken(); // Get Clerk token
        if (!token) throw new Error("Not authenticated");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await apiRequest("GET", "/api/profile", undefined, headers); // Pass headers
        return res.json();
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        throw new Error(err.message || "Failed to load profile data. Please try again.");
      }
    },
    enabled: !!getToken, // Only run query if getToken is available
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  // Setup form
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      bio: "",
    },
    // Update form defaults when profile data loads
    values: profile ? {
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phoneNumber: profile.phoneNumber || "",
      email: profile.email || "",
      bio: profile.bio || "",
    } : undefined,
  });

  // Mutation for updating profile
  const mutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      try {
        const token = await getToken(); // Get Clerk token
        if (!token) throw new Error("Not authenticated");
        const headers = { Authorization: `Bearer ${token}` };
        const res = await apiRequest("PUT", "/api/profile", data, headers); // Pass headers
        return res.json();
      } catch (err: any) {
        console.error("Error updating profile:", err);
        throw new Error(err.message || "Failed to update profile. Please try again.");
      }
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["/api/profile"], updatedProfile);
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate(data);
  };

  // Password changes are handled by Clerk UI/API through the UserButton component
  // Users can click on the UserButton in the sidebar to access account settings

  return (
    <div className="flex flex-col md:flex-row h-screen">
      <Sidebar />
      <AnimatedPage className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription>Update your profile details.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {error && (
              <div className="text-red-600 p-4 bg-red-50 rounded border border-red-200">
                <p className="mb-2">Error loading profile: {error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
            {!isLoading && !error && profile && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Wrap First Name and Last Name in a grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your last name" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Add Phone Number Field */}
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Your phone number" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us a little about yourself" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>A short description about you.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Password Change Note Card */}
        <Card className="mt-6">
           <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-4">
              <p className="mb-4">Password changes are managed through your Clerk account settings.</p>
              <p className="mb-4">Click on your profile picture in the sidebar to access account settings, where you can change your password and manage other account details.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="outline" onClick={() => window.open(`https://accounts.clerk.dev/user/${userId}`, '_blank')}>
                  Open Account Settings
                </Button>
                <Button variant="secondary" onClick={() => window.open(`https://accounts.clerk.dev/user/${userId}/security`, '_blank')}>
                  Manage Security Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </AnimatedPage>
    </div>
  );
}