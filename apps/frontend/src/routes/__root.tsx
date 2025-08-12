import {
  createRootRoute,
  Outlet,
  useRouterState,
  useNavigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Navbar } from "../components/Navbar";
import { CssBaseline } from "@mui/material";
import { useStore } from "../context/StoreContext";
import { useEffect } from "react";

export const Route = createRootRoute({
  component: () => {
    const { activeStore } = useStore();
    const router = useRouterState();
    const navigate = useNavigate();

    useEffect(() => {
      const publicRoutes = ["/", "/login"];
      // If not logged in and not on a public route, redirect to root
      if (!activeStore && !publicRoutes.includes(router.location.pathname)) {
        navigate({ to: "/" });
      }
    }, [activeStore, router.location.pathname, navigate]);

    return (
      <>
        <CssBaseline />
        <Navbar />
        <Outlet />
        <TanStackRouterDevtools />
      </>
    );
  },
});
