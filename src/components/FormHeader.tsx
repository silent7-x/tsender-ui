import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState, type ComponentPropsWithoutRef } from "react";

type FormHeaderProps = ComponentPropsWithoutRef<"div">;

export const FormHeader = ({ className }: FormHeaderProps) => {
  const [mode, setMode] = useState("safe");

  return (
    <Tabs
      value={mode}
      onValueChange={setMode}
      className={cn("flex flex-row justify-between", className)}
    >
      <h1 className="text-xl text-foreground">T-Sender</h1>
      <TabsList>
        <TabsTrigger value="safe">Safe Mode</TabsTrigger>
        <TabsTrigger value="unsafe">Unsafe Mode</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
