import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../../context/StoreContext";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { useAdminGuard } from "../../hooks/useAdminGuard";

// Fetch salesman details and stats
const fetchSalesmanDetails = async (storeId: number, salesmanId: number) => {
  // Get salesman info
  const salesmanRes = await fetch(
    `http://localhost:3001/api/salesmen/${salesmanId}`,
  );
  if (!salesmanRes.ok) throw new Error("Salesman not found");
  const salesman = await salesmanRes.json();

  // Get sales stats for this salesman (all time)
  const statsRes = await fetch(
    `http://localhost:3001/api/stores/${storeId}/salesmen`,
  );
  const statsArr = await statsRes.json();
  const stats =
    Array.isArray(statsArr) && statsArr.length > 0
      ? statsArr.find((s: any) => s.id === salesmanId) || {
          unitsSold: 0,
          totalSales: 0,
          totalCredit: 0,
        }
      : { unitsSold: 0, totalSales: 0, totalCredit: 0 };

  return { ...salesman, ...stats };
};

function SalesmanDetailsPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const { id } = useParams({ from: "/salesmen/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const salesmanId = Number(id);

  const {
    data: salesman,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["salesmanDetails", activeStore?.id, salesmanId],
    queryFn: () => fetchSalesmanDetails(activeStore!.id, salesmanId),
    enabled: !!activeStore && !!salesmanId,
  });

  // Form state
  const [name, setName] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  // PATCH mutation for editing name
  const mutation = useMutation({
    mutationFn: async () => {
      if (name.trim() === "" || name === salesman.name) {
        throw new Error("No changes to update");
      }
      const res = await fetch(
        `http://localhost:3001/api/salesmen/${salesmanId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim() }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update salesman");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["salesmanDetails", activeStore?.id, salesmanId],
      });
      setEditError(null);
      setName("");
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update salesman");
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error || !salesman)
    return <Typography color="error">Salesman not found.</Typography>;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" mb={2}>
        Salesman Details
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Salesman Name</TableCell>
              <TableCell>Units Sold</TableCell>
              <TableCell>Money Made</TableCell>
              <TableCell>Total Credit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{salesman.name}</TableCell>
              <TableCell>{salesman.unitsSold ?? 0}</TableCell>
              <TableCell>
                Rs.{" "}
                {salesman.totalSales ? salesman.totalSales.toFixed(2) : "0.00"}
              </TableCell>
              <TableCell>
                Rs.{" "}
                {salesman.totalCredit
                  ? salesman.totalCredit.toFixed(2)
                  : "0.00"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" mb={1}>
        Edit Salesman
      </Typography>
      <Stack spacing={2} mb={2}>
        <TextField
          label="Salesman Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={salesman.name}
        />
        {editError && <Alert severity="error">{editError}</Alert>}
        <Button
          variant="contained"
          color="primary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </Stack>
      <Button variant="outlined" onClick={() => navigate({ to: "/salesmen" })}>
        Back to Salesmen
      </Button>
    </Box>
  );
}

export const Route = createFileRoute("/salesmen/$id")({
  component: SalesmanDetailsPage,
});
