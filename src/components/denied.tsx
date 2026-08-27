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
          <h1 className="text-2xl font-bold">Camera access denied</h1>
          <p className="text-black/70">
            AR EPFL needs your camera to detect your hands and display the logo
            in augmented reality. Without this permission, the experience can't
            start.
          </p>
          <p className="text-black/70">
            Open your browser settings, allow camera access for this site, then
            reload the page to try again.
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="gap-2 py-5"
          >
            <RefreshCw className="h-4 w-4" />
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
