"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type SendStatus = "idle" | "sending" | "sent" | "error";

export default function PhotoDialog({
  photo,
  onClose,
}: {
  photo: string | null;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");

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
          <DialogTitle>Your photo</DialogTitle>
        </DialogHeader>
        {photo && (
          // biome-ignore lint/performance/noImgElement: locally captured data URL, not an optimizable remote asset
          <img
            src={photo}
            alt="Captured AR scene"
            className="max-h-[65vh] w-full rounded-lg object-contain"
          />
        )}
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {status === "error" && (
          <p className="text-sm text-destructive">
            Couldn't send the email. Try again.
          </p>
        )}
        <DialogFooter>
          <Button
            onClick={handleSend}
            disabled={!email || status === "sending"}
          >
            {status === "sending"
              ? "Sending…"
              : status === "sent"
                ? "Sent!"
                : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
