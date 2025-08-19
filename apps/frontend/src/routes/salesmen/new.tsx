import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../../context/StoreContext";
import {
  salesmanCreateSchema,
  type SalesmanCreateInput,
} from "@shared/validation/salesman";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useAdminGuard } from "../../hooks/useAdminGuard";

function NewSalesman() {
  useAdminGuard();
  const { activeStore } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!activeStore) throw new Error("No store selected");

      // Prepare and validate payload
      const payload: SalesmanCreateInput = {
        name: form.name.trim(),
        storeId: activeStore.id,
      };

      const parseResult = salesmanCreateSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new Error(
          parseResult.error.issues.map((i) => i.message).join(", "),
        );
      }

      const res = await fetch("http://localhost:3001/api/salesmen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add salesman");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salesmen"] });
      navigate({ to: "/salesmen" });
    },
    onError: (err: any) => {
      setError(err.message || "Failed to add salesman");
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 4, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          Add New Salesman to {activeStore?.name}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Salesman Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            variant="contained"
            color="primary"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Adding..." : "Add Salesman"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export const Route = createFileRoute("/salesmen/new")({
  component: NewSalesman,
});
