import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Canvas from "@/pages/Canvas";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";

const AppRouter = () => (
  <Switch>
    <Route path="/" component={Canvas} />
    <Route component={NotFound} />
  </Switch>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRouter />
    <Toaster />
  </QueryClientProvider>
);

export default App;
