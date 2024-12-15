import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const UserProfile = () => {
  return (
    <div className="p-6">
      <div className="mb-4">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar>
            <AvatarFallback className="bg-sage-100">JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-purple-800 dark:text-white">John Doe</span>
            <span className="text-xs text-muted-foreground">Pro Member</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;