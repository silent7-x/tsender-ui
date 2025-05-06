import { ConnectButton } from "@rainbow-me/rainbowkit";

function App() {
  return (
    <main className="min-h-screen max-w-screen-xl mx-auto pt-4 px-6 bg-amber-100">
      <header className="flex justify-end">
        <ConnectButton />
      </header>
      <h1 className="">Hello World</h1>
    </main>
  );
}

export default App;
