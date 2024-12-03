"use client";

import { useEffect, useState } from "react";
import { createNewBrowserClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createNewBrowserClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setIsLoggedIn(true);
      } else {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
      }
      setIsLoading(false);
    };
    void checkUser();
  }, [supabase.auth, router, pathname]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
