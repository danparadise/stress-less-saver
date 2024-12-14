import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  return (
    <div className="flex justify-between items-center">
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          className="pl-8 bg-white/50 backdrop-blur-sm border-neutral-200 dark:border-neutral-700"
          onChange={onSearch}
        />
      </div>
    </div>
  );
};

export default SearchBar;