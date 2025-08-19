import { useAdmin } from "../context/AdminContext";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

export function useAdminGuard() {
  const { adminUnlocked } = useAdmin();
  const navigate = useNavigate();
  const router = useRouterState();

  useEffect(() => {
    // Don't redirect if already on /admin/unlock
    if (
      !adminUnlocked &&
      router.location.pathname !== "/admin/unlock"
    ) {
      navigate({
        to: "/admin/unlock",
        search: { next: router.location.pathname },
      });
    }
  }, [adminUnlocked, navigate, router.location.pathname]);
}
