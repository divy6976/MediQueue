"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/component/Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  if (pathname === "/display" || pathname.startsWith("/track")) {
    return null;
  }
  return <Navbar />;
}
