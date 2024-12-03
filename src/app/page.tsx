// import { AuthWrapper } from "@/components/ui/auth-wrapper";
import dynamic from "next/dynamic";

// Dynamically import Flow component with SSR disabled
const Flow = dynamic(
  () => import("@/components/Flow").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-500 dark:text-gray-400">
          Loading Pylon's Canvas Editor...
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="h-screen">
      {/* <AuthWrapper> */}
      <Flow />
      {/* </AuthWrapper> */}
    </main>
  );
}
