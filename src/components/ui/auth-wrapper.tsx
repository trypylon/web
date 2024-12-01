"use client";

import { useEffect, useState } from "react";
import { createNewBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createNewBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setIsLoggedIn(true);
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };
    void checkUser();
  }, [supabase.auth, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoggedIn) {
    return null; // This shouldn't be visible as we're redirecting non-logged in users
  }

  return <>{children}</>;
}
