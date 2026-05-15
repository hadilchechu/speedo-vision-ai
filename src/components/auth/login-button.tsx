import { useEffect, useState } from "react";
import { AuthModal } from "./auth-modal";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function LoginButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={user.user_metadata?.avatar_url}
          alt={user.user_metadata?.full_name}
          className="h-8 w-8 rounded-full border border-gray-200"
        />
        <span className="text-sm font-medium text-gray-700">
          {user.user_metadata?.full_name}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[42px] items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm"
      >
        Login with Google
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}