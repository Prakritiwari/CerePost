import Link from "next/link";
import { Button } from "@/components/ui/button";
import LinkButton from "@/components/link-account-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <LinkButton />
    </main>
  );
}
