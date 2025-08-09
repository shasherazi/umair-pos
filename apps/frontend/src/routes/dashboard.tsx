import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AddSaleDialog } from "../components/AddSaleDialog";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "../context/StoreContext";
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
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";

const fetchCurrentMonthSales = async () => {
  const res = await fetch("http://localhost:3001/api/sales/current-month");
  return res.json();
};

function Dashboard() {
  const { activeStore } = useStore();
  const {
    data: sales,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["currentMonthSales"],
    queryFn: fetchCurrentMonthSales,
  });

  // Filter sales for the active store only
  const filteredSales = sales?.filter(
    (sale: any) => sale.storeId === activeStore?.id,
  );

  const [addSaleOpen, setAddSaleOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSaleAdded = () => {
    // Refetch sales after adding
    queryClient.invalidateQueries({ queryKey: ["currentMonthSales"] });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        mb={2}
      >
        <Typography variant="h5">
          {activeStore
            ? `Sales for ${activeStore.name} (This Month)`
            : "Sales (This Month)"}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setAddSaleOpen(true)}
        >
          Add Sale
        </Button>
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Error loading sales</Typography>
      ) : !filteredSales || filteredSales.length === 0 ? (
        <Box textAlign="center" mt={6}>
          <SentimentDissatisfiedIcon color="disabled" sx={{ fontSize: 60 }} />
          <Typography variant="h6" mt={2}>
            No sales this month yet.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start by adding your first sale!
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Discount (%)</TableCell>
                <TableCell>Discounted Price</TableCell>
                <TableCell align="right">Total Items</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {new Date(sale.saleTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {sale.saleItems
                      ? sale.saleItems
                          .reduce(
                            (sum: number, item: any) =>
                              sum + item.price * item.quantity,
                            0,
                          )
                          .toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell>{sale.discount ?? 0}</TableCell>
                  <TableCell>{sale.total}</TableCell>
                  <TableCell align="right">
                    {sale.saleItems
                      ? sale.saleItems.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0,
                        )
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <AddSaleDialog
        open={addSaleOpen}
        onClose={() => setAddSaleOpen(false)}
        onSaleAdded={handleSaleAdded}
      />
    </Box>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});
