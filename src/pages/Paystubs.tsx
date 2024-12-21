import { useRef, useState, useEffect } from "react";
import PaystubData from "@/components/dashboard/PaystubData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, Lock } from "lucide-react";
import { uploadDocument } from "@/utils/documentUpload";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

const Paystubs = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const { data: subscriptionStatus, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        await uploadDocument(file, "paystub", new Date());
        toast.success("Document uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error uploading document");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Error creating checkout session");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  if (isSubscriptionLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscriptionStatus?.subscribed) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Premium Feature
            </CardTitle>
            <CardDescription>
              Subscribe to access paystub management and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Upload and store paystubs securely</li>
                <li>Automatic data extraction</li>
                <li>Track income trends over time</li>
                <li>Export and analyze pay history</li>
              </ul>
              <Button 
                className="w-full" 
                onClick={handleCheckout}
                disabled={isCheckoutLoading}
              >
                {isCheckoutLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe Now'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
            Paystubs
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            View and manage your paystub documents
          </p>
        </div>
        <div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Paystub
              </>
            )}
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,application/pdf"
            disabled={isUploading}
          />
        </div>
      </div>
      <PaystubData />
    </div>
  );
};

export default Paystubs;