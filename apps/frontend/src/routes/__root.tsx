import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Navbar } from "../components/Navbar";
import { CssBaseline } from "@mui/material";

export const Route = createRootRoute({
  component: () => (
    <>
      <CssBaseline />
      <Navbar />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
