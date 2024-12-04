"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthWrapper } from "@/components/ui/auth-wrapper";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Plus } from "lucide-react";

interface Canvas {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function CanvasesPage() {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/canvases")
      .then((res) => res.json())
      .then((data) => {
        setCanvases(data.canvases);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching canvases:", error);
        setLoading(false);
      });
  }, []);

  return (
    <AuthWrapper>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Canvases</h1>
          <Button onClick={() => router.push("/")} className="space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Canvas</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : canvases.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-500">No canvases saved yet</p>
            <Button onClick={() => router.push("/")}>
              Create Your First Canvas
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {canvases.map((canvas) => (
              <div
                key={canvas.id}
                className="border rounded-lg p-4 space-y-2 hover:border-blue-500 cursor-pointer"
                onClick={() => router.push(`/?canvas=${canvas.id}`)}
              >
                <h3 className="font-medium">{canvas.name}</h3>
                {canvas.description && (
                  <p className="text-sm text-gray-500">{canvas.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Last updated{" "}
                  {formatDistanceToNow(new Date(canvas.updated_at))} ago
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthWrapper>
  );
}
