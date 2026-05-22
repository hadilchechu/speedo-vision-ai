import { useEffect, useState } from "react";
import { AuthModal } from "./auth-modal";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { loadProjectsFromSupabase } from "@/lib/projects-store";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.215 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.194 0-9.624-3.332-11.083-7.946l-6.522 5.025C9.705 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-1.058 3.007-3.196 5.401-6.084 6.571l.003-.002 6.19 5.238C35.973 39.47 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function getDisplayName(user: User) {
  return user.user_metadata?.full_name || user.email || "User";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function LoginButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAvatarFailed(false);

      if (session?.user) {
        loadProjectsFromSupabase();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAvatarFailed(false);

      if (session?.user) {
        loadProjectsFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();

    if (window.location.pathname === "/") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  if (user) {
    const displayName = getDisplayName(user);
    const avatarUrl = user.user_metadata?.avatar_url;
    const showAvatarImage = avatarUrl && !avatarFailed;

    return (
      <div className="flex h-11 items-center gap-3 rounded-[12px] border border-[#E5E7EB] bg-white px-3 shadow-sm transition-all duration-200 hover:border-[#D1D5DB] hover:shadow-md">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D9E7F2] bg-[#EEF2FF] text-xs font-semibold text-[#2E86AB]">
          {showAvatarImage ? (
            <img
              src={avatarUrl}
              alt={displayName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            getInitials(displayName)
          )}
        </div>

        <div className="flex flex-col leading-tight">
          <span className="max-w-[140px] truncate text-sm font-semibold text-[#111827]">
            {displayName}
          </span>

          <button
            type="button"
            onClick={handleSignOut}
            className="text-left text-[11px] font-medium text-[#6B7280] transition-colors hover:text-[#111827]"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          group inline-flex h-11 items-center gap-3
          rounded-[12px] border border-[#D9E7F2]
          bg-white px-4
          shadow-sm
          transition-all duration-200
          hover:border-[#53A5D8]
          hover:bg-[#F8FBFE]
          hover:shadow-md
        "
      >
        <div
          className="
            flex h-7 w-7 items-center justify-center
            rounded-xl bg-[#F3F8FC]
            transition-colors duration-200
            group-hover:bg-[#E8F4FB]
          "
        >
          <GoogleIcon />
        </div>

        <span className="text-sm font-medium text-[#111827]">Login with Google</span>
      </button>

      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
