"use client";

import dynamic from "next/dynamic";

const ArScene = dynamic(() => import("@/components/scene"), { ssr: false });

export default function Home() {
  return (
    <main className="fixed inset-0">
      <ArScene />
    </main>
  );
}
