"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useFlowStore } from "@/store/flowStore";

const Flow = dynamic(
  () => import("@/components/Flow").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 ml-16">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading Pylon's Canvas Editor...
        </div>
      </div>
    ),
  }
);
export default function Home() {
  const searchParams = useSearchParams();
  const loadCanvas = useFlowStore((state) => state.loadCanvas);

  useEffect(() => {
    const canvasId = searchParams.get("canvas");
    if (canvasId) {
      loadCanvas(canvasId).catch(console.error);
    }
  }, [searchParams, loadCanvas]);

  return (
    <main className="h-screen  ml-16">
      <Flow />
    </main>
  );
}
