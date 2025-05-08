import { AirdropForm } from "./components/AirdropForm";
import { FormHeader } from "./components/FormHeader";
import { Header } from "./components/Header";
import { Card } from "./components/ui/card";

export function App() {
  return (
    <main className="min-h-screen max-w-screen-xl mx-auto">
      <Header />
      <Card className="p-6">
        <FormHeader />
        <AirdropForm />
      </Card>
    </main>
  );
}
