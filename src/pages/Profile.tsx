import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Profile = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-purple-800 mb-6">Profile</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Display Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter display name"
            />
            <Button 
              onClick={handleUpdateProfile}
              disabled={isLoading}
            >
              Update Display Name
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/privacy" className="block text-purple-600 hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="block text-purple-600 hover:underline">
              Terms of Service
            </Link>
            <Link to="/ccpa" className="block text-purple-600 hover:underline">
              CCPA Notice
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;