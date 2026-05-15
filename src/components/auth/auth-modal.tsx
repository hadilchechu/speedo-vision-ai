import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { signInWithGoogle } from "@/lib/supabase";
import { GoogleLogo } from "./google-logo";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const onContinue = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start Google sign in.");
      setBusy(false);
    }
  };

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        type="button"
        aria-label="Close authentication modal"
        className="absolute inset-0 bg-gray-950/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className={`relative w-full max-w-[420px] rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl transition duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <GoogleLogo className="h-7 w-7" />
        </div>

        <div className="text-center">
          <h2 id="auth-modal-title" className="text-2xl font-bold tracking-tight text-gray-950">
            Welcome to Speedo.ai
          </h2>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue</p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onContinue()}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
        >
          <GoogleLogo className="h-5 w-5" />
          {busy ? "Opening Google..." : "Continue with Google"}
        </button>

        <p className="mx-auto mt-6 max-w-xs text-center text-xs leading-5 text-gray-400">
          By continuing, you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
