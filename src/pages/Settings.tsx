import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error("Failed to send reset password email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelMembership = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('cancel-subscription');
      if (error) throw error;
      
      toast.success("Membership cancelled successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to cancel membership");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-purple-800 mb-6">Settings</h1>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={handleResetPassword}
              disabled={isLoading}
            >
              Reset Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={handleCancelMembership}
              disabled={isLoading}
            >
              Cancel Membership
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;