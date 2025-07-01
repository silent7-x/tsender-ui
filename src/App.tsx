import { cn } from "@/lib/utils";
import { MoveRight } from "lucide-react";
import { injected, useAccount, useConnect } from "wagmi";
import { AirdropForm } from "./components/AirdropForm";
import { FormHeader } from "./components/FormHeader";
import { Header } from "./components/Header";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

export function App() {
  const account = useAccount();
  const { connect } = useConnect();

  return (
    <main className="min-h-screen max-w-screen-xl mx-auto">
      <Header title="T-Sender" />
      <div className="flex flex-col items-center justify-center pb-6 pt-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
          Token Airdrop
        </h1>
        <p className="text-muted-foreground text-lg">
          Send tokens to multiple addresses in a single transaction
        </p>
      </div>

      <div className="flex flex-col justify-center items-center">
        <Card
          className={cn(
            "p-6 transition-all w-full",
            !account.isConnected && "pointer-events-none opacity-90 blur-xs"
          )}
        >
          <FormHeader />
          <AirdropForm />
        </Card>
        {!account.isConnected && (
          <Button
            onClick={() => connect({ connector: injected() })}
            className="my-6 py-4 px-4 pointer-events-auto text-primary-foreground text-sm font-semibold rounded-md"
          >
            Please connect your wallet to continue
            <MoveRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </main>
  );
}
