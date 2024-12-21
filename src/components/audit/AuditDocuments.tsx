import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

interface AuditDocumentsProps {
  selectedMonth: string | null;
}

const AuditDocuments = ({ selectedMonth }: AuditDocumentsProps) => {
  const { data: documents } = useQuery({
    queryKey: ["audit-documents", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;

      const { data, error } = await supabase
        .from("financial_documents")
        .select("*")
        .eq("month_year", selectedMonth)
        .order("upload_date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedMonth
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("financial_docs")
      .download(filePath);

    if (error) {
      console.error("Error downloading file:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!documents) {
    return <div>Select a month to view documents</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Document Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Upload Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {doc.file_name}
              </div>
            </TableCell>
            <TableCell>{doc.document_type}</TableCell>
            <TableCell>
              {doc.upload_date && format(new Date(doc.upload_date), "MMM d, yyyy")}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                doc.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {doc.status}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(doc.file_path, doc.file_name)}
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Download</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AuditDocuments;