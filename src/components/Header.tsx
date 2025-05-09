import { ModeToggle } from "@/components/Mode-Toggle";
import { Card } from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { TicketsPlane } from "lucide-react";
import { FaGithub } from "react-icons/fa";

export function Header() {
  return (
    <header className="py-4 ">
      <Card className="flex flex-row items-center justify-between px-4 py-2">
        <div className="flex items-center justify-center gap-2">
          <TicketsPlane className="size-10 text-[#ff8000] -mt-1.5" />
          <span className="text-foreground font-bold text-2xl">T-Sender</span>
          <a
            href="https://github.com/silent7-x/tsender-ui"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub className="size-8 mx-2" />
          </a>
          <p className="text-muted-foreground text-sm">
            "The most gas efficient airdrop contract on earth!"
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ConnectButton />
          <ModeToggle />
        </div>
      </Card>
    </header>
  );
}
