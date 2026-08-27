import { Progress } from "@/components/ui/progress";

export default function CameraLoader({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white px-6 text-center">
      <div className="w-full max-w-xs space-y-4">
        <p className="text-black/70">{text}</p>
        <Progress value={null} className="w-full" />
      </div>
    </div>
  );
}
