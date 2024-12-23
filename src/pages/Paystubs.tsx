import { useRef, useState } from "react";
import PaystubData from "@/components/dashboard/PaystubData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { uploadDocument } from "@/utils/documentUpload";
import { toast } from "sonner";

const Paystubs = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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