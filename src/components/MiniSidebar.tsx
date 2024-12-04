import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Key, FolderOpen, Rocket } from "lucide-react";

export function MiniSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-16 border-r bg-background">
      <div className="flex h-full flex-col items-center justify-between py-4">
        <div className="space-y-2 w-full">
          <Link href="/">
            <div
              className={cn(
                "flex h-12 w-full items-center justify-center",
                pathname === "/" && "bg-accent"
              )}
            >
              <Home className="h-6 w-6" />
            </div>
          </Link>
          <Link href="/canvases">
            <div
              className={cn(
                "flex h-12 w-full items-center justify-center",
                pathname === "/canvases" && "bg-accent"
              )}
            >
              <FolderOpen className="h-6 w-6" />
            </div>
          </Link>
          <Link href="/deployments">
            <div
              className={cn(
                "flex h-12 w-full items-center justify-center",
                pathname === "/deployments" && "bg-accent"
              )}
            >
              <Rocket className="h-6 w-6" />
            </div>
          </Link>
        </div>
        <div>
          <Link href="/credentials">
            <div
              className={cn(
                "flex h-12 w-full items-center justify-center",
                pathname === "/credentials" && "bg-accent"
              )}
            >
              <Key className="h-6 w-6" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
