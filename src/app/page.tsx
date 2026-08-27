"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import PhotoDialog from "@/components/photo";

const ArScene = dynamic(() => import("@/components/scene"), { ssr: false });

export default function Home() {
  const [photo, setPhoto] = useState<string | null>(null);

  return (
    <main className="fixed inset-0">
      <ArScene onPhotoCaptured={setPhoto} />
      <PhotoDialog photo={photo} onClose={() => setPhoto(null)} />
    </main>
  );
}
