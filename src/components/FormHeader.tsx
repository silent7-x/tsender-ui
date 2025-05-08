import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function FormHeader() {
  const [mode, setMode] = useState("safe");
  console.log("mode", mode);

  return (
    <Tabs
      value={mode}
      onValueChange={setMode}
      className="flex flex-row justify-between"
    >
      <h1 className="text-xl text-foreground">T-Sender</h1>
      <TabsList>
        <TabsTrigger value="safe">Safe Mode</TabsTrigger>
        <TabsTrigger value="unsafe">Unsafe Mode</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
