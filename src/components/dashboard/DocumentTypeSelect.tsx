import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const DocumentTypeSelect = ({ value, onValueChange }: DocumentTypeSelectProps) => {
  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select document type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paystub">Paystub</SelectItem>
          <SelectItem value="bank_statement">Bank Statement</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DocumentTypeSelect;