"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StaffPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/staff/orders");
  }, [router]);

  return null;
}
