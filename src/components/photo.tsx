"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SendStatus = "idle" | "sending" | "sent" | "error";

// Quick-pick domain buttons instead of the browser's native autocomplete,
// which would surface other visitors' saved addresses on this shared kiosk.
const EMAIL_DOMAINS = [
  "@epfl.ch",
  "@gmail.com",
  "@outlook.com",
  "@hotmail.com",
  "@icloud.com",
];

export default function PhotoDialog({
  photo,
  onClose,
}: {
  photo: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  function applyDomain(domain: string) {
    const local = email.split("@")[0];
    setEmail(local + domain);
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // type="text" (see below) so selection APIs are actually supported here;
    // browsers throw on setSelectionRange for type="email" inputs.
    requestAnimationFrame(() =>
      input.setSelectionRange(local.length, local.length),
    );
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    onClose();
    setEmail("");
    setStatus("idle");
  }

  async function handleSend() {
    if (!photo || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, photo }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Dialog open={photo !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ta photo</DialogTitle>
          <DialogDescription>
            Elle est réussie ! Laisse ton email ci-dessous et on te l'envoie en
            haute résolution.
          </DialogDescription>
        </DialogHeader>
        {photo && (
          // biome-ignore lint/performance/noImgElement: locally captured data URL, not an optimizable remote asset
          <img
            src={photo}
            alt="Toi en réalité augmentée"
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        )}
        <Input
          ref={inputRef}
          type="text"
          inputMode="email"
          placeholder="toi@exemple.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleSend()}
          autoFocus
          autoComplete="off"
          className="h-12 px-4 text-base"
          data-protonpass-ignore="true"
        />
        <div className="flex justify-between gap-2 ">
          {EMAIL_DOMAINS.map((domain) => (
            <Button
              key={domain}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => applyDomain(domain)}
              className="bg-muted flex-1 py-4 text-foreground hover:bg-muted/70"
            >
              {domain}
            </Button>
          ))}
        </div>
        {status === "error" && (
          <p className="text-sm text-destructive">
            L'envoi de l'email a échoué. Réessaie.
          </p>
        )}
        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!email || status === "sending"}
            className="w-full py-5 text-base"
          >
            {status === "sending"
              ? "Envoi…"
              : status === "sent"
                ? "Envoyé !"
                : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
