"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POST_LOGIN_REDIRECT_KEY = "evensteven.postLoginRedirect";

export function PostLoginRedirector() {
  const router = useRouter();

  useEffect(() => {
    let target: string | null = null;
    try {
      target = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
      if (target) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    } catch {
      // ignore
    }
    if (target && target.startsWith("/") && target !== "/dashboard") {
      router.replace(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
