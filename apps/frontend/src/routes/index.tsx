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
  Button,
  Stack,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import AddIcon from "@mui/icons-material/Add";
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        mt: -4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Select a Store
      </Typography>
      <List>
        {data.map((store: { id: number; name: string }) => (
          <ListItem
            sx={{
              cursor: "pointer",
              mb: 1,
              backgroundColor: "grey.200",
              borderRadius: "8px",
              minWidth: "300px",
              py: 1,
            }}
            key={store.id}
            secondaryAction={
              <IconButton
                sx={{
                  color: "primary.main",
                  backgroundColor: "white",
                  ":hover": { backgroundColor: "white" },
                }}
                edge="end"
                aria-label="login"
                onClick={() => {
                  navigate({
                    to: "/login",
                    search: { storeId: String(store.id) },
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
      <Stack direction="row" justifyContent="center" mt={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: "/stores/new" })}
        >
          Add Store
        </Button>
      </Stack>
    </Box>
  );
}

export const Route = createFileRoute("/")({
  component: Index,
});
