"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/clients";
import SatyaTicketing from "../SatyaTicketing";

export default function SatyaTicketingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
        return;
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) return <div className="p-8">Checking authentication...</div>;

  return <SatyaTicketing />;
}
