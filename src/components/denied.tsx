import { CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CameraDeniedPage() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white px-6 text-black">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-[#c8002a]/10 p-6">
            <CameraOff className="h-12 w-12 text-[#c8002a]" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold">Accès à la caméra refusé</h1>
          <p className="text-black/70">
            AR EPFL a besoin de ta caméra pour détecter tes mains et afficher le
            logo en réalité augmentée. Sans cette autorisation, l'expérience ne
            peut pas démarrer.
          </p>
          <p className="text-black/70">
            Ouvre les réglages de ton navigateur, autorise l'accès à la caméra
            pour ce site, puis recharge la page pour réessayer.
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="gap-2 py-5"
          >
            <RefreshCw className="h-4 w-4" />
            Recharger la page
          </Button>
        </div>
      </div>
    </div>
  );
}
