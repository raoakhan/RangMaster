import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Lobby from "@/pages/lobby";
import Game from "@/pages/game";
import { GameProvider } from "@/context/game-context";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/room/:roomId" component={Lobby} />
      <Route path="/game/:roomId" component={Game} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <Router />
        <Toaster />
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;
