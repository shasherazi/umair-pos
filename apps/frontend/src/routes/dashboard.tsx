import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "../context/StoreContext";
import { Typography, Box } from "@mui/material";
import { useEffect } from "react";

function Dashboard() {
  const { activeStore, setActiveStore } = useStore();

  // Ensure context is synced with localStorage
  useEffect(() => {
    if (!activeStore) {
      const stored = localStorage.getItem("activeStore");
      if (stored) setActiveStore(JSON.parse(stored));
    }
  }, [activeStore, setActiveStore]);

  return (
    <Box sx={{ mt: 4, textAlign: "center" }}>
      <Typography variant="h4">
        Hello{activeStore ? `, welcome to ${activeStore.name}!` : "!"}
      </Typography>
    </Box>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});
