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

const DocumentUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [date, setDate] = useState<Date>();
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      await uploadDocument(file, documentType, date);

      toast({
        title: "Success",
        description: "Document uploaded successfully",
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
          Upload your paystubs and bank statements securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DocumentTypeSelect value={documentType} onValueChange={setDocumentType} />
        <MonthPicker date={date} onSelect={setDate} />

        <div className="space-y-2">
          <Input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
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