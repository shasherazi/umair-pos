import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useStore } from "../context/StoreContext";
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import { useEffect } from "react";

const fetchStores = async () => {
  const res = await axios.get("http://localhost:3001/api/stores");
  return res.data;
};

function Index() {
  const { setActiveStore } = useStore();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchStores,
  });

  // Clear active store on mount
  useEffect(() => {
    setActiveStore(null);
  }, [setActiveStore]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Error loading stores</Typography>;

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Select a Store
      </Typography>
      <List>
        {data.map((store: { id: number; name: string }) => (
          <ListItem
            key={store.id}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="login"
                onClick={() => {
                  setActiveStore(store, () => {
                    navigate({ to: "/dashboard" });
                  });
                }}
              >
                <LoginIcon />
              </IconButton>
            }
          >
            <ListItemText primary={store.name} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});
