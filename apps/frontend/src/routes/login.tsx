import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { z } from "zod";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

function LoginPage() {
  const navigate = useNavigate();
  const { setActiveStore } = useStore();
  const { storeId } = useSearch({ from: "/login" });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:3001/api/stores/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (store) => {
      setActiveStore(store);
      navigate({ to: "/reports/sales" });
    },
    onError: (err: any) => {
      setError(err.message || "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          Store Login
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button
              variant="contained"
              color="primary"
              disabled={mutation.isPending}
              type="submit"
            >
              {mutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export const Route = createFileRoute("/login")({
  validateSearch: z.object({
    storeId: z.string(),
  }),
  component: LoginPage,
});
