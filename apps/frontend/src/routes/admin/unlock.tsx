import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useState } from "react";
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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAdmin } from "../../context/AdminContext";
import { z } from "zod";

function AdminUnlockPage() {
  const navigate = useNavigate();
  const { setAdminUnlocked } = useAdmin();
  const { next } = useSearch({ from: "/admin/unlock" });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("http://localhost:3001/api/admin/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Unlock failed");
      return;
    }
    setAdminUnlocked(true);
    navigate({ to: next || "/" });
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          Admin Unlock
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Admin Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              InputProps={{
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
              }}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="contained" color="primary" type="submit">
              Unlock
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export const Route = createFileRoute("/admin/unlock")({
  validateSearch: z.object({
    next: z.string().optional(),
  }),
  component: AdminUnlockPage,
});
