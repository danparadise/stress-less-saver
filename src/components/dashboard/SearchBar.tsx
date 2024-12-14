import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar = ({ onSearch }: SearchBarProps) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-black dark:text-white">Financial Overview</h2>
      <div className="relative w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          className="pl-8 bg-white/50 backdrop-blur-sm"
          onChange={onSearch}
        />
      </div>
    </div>
  );
};

export default SearchBar;