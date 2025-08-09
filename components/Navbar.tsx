"use client";

import Image from "next/image";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

export function Navbar() {
  return (
    <header className="bg-background border-b">
      <div className="max-w-4xl mx-auto h-14 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/favicon.ico"
            alt="Keytones Logo"
            width={24}
            height={24}
          />
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}
