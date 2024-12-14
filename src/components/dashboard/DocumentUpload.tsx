import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadDocument } from "@/utils/documentUpload";
import DocumentTypeSelect from "./DocumentTypeSelect";
import MonthPicker from "./MonthPicker";

const SUPPORTED_FORMATS = ["image/png", "image/jpeg", "image/gif", "image/webp", "application/pdf"];

const DocumentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (!SUPPORTED_FORMATS.includes(selectedFile.type)) {
        toast({
          title: "Invalid File Format",
          description: "Please upload an image file (PNG, JPEG, GIF, WebP) or a PDF file",
          variant: "destructive",
        });
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const initialStatus = file.type === "application/pdf" ? "pending_conversion" : "pending";
      const result = await uploadDocument(file, documentType, date, initialStatus);

      toast({
        title: "Success",
        description: file.type === "application/pdf" 
          ? "PDF uploaded and conversion started. This may take a moment."
          : "Document uploaded successfully",
      });

      // Reset form
      setFile(null);
      setDocumentType("");
      setDate(undefined);
      
      if (document.querySelector<HTMLInputElement>('input[type="file"]')) {
        document.querySelector<HTMLInputElement>('input[type="file"]')!.value = '';
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>
          Upload your paystub images or PDFs securely (PNG, JPEG, GIF, WebP, or PDF formats)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentTypeSelect value={documentType} onValueChange={setDocumentType} />
        <MonthPicker date={date} onSelect={setDate} />

        <div className="space-y-2">
          <Input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            onChange={handleFileChange}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleUpload}
          disabled={isUploading || !file || !documentType || !date}
        >
          {isUploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;