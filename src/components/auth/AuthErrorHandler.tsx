import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const handleAuthError = (error: { message: string; email?: string }) => {
  if (error.message.includes('already registered')) {
    toast.error(
      <div className="space-y-2">
        <p>This email is already registered.</p>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.reload()}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Sign in
          </button>
          <span>or</span>
          <button
            onClick={() => {
              supabase.auth.resetPasswordForEmail(error.email || '');
              toast.info('Password reset instructions sent to your email');
            }}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Reset password
          </button>
        </div>
      </div>
    );
  } else {
    toast.error(error.message);
  }
};