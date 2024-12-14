import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${documentType}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("financial_docs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("financial_documents").insert({
        document_type: documentType,
        file_path: filePath,
        file_name: file.name,
        month_year: format(date, "yyyy-MM-dd"),
      });

      if (dbError) throw dbError;

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
        <div className="space-y-2">
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paystub">Paystub</SelectItem>
              <SelectItem value="bank_statement">Bank Statement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "MMMM yyyy") : "Select month"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

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