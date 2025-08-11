import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../../context/StoreContext";
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

function SalesReport() {
  const navigate = useNavigate();
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

  return (
    <Box sx={{ mx: "auto", mt: 4, p: 2 }}>
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
          onClick={() => navigate({ to: "/reports/sales/new" })}
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
                <TableCell>Sale ID</TableCell>
                <TableCell>Shop name</TableCell>
                <TableCell>Sale type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Discount (%)</TableCell>
                <TableCell>Sale Price</TableCell>
                <TableCell>Total Items</TableCell>
                <TableCell align="right">Sale Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.map((sale: any) => (
                <TableRow
                  key={sale.id}
                  onClick={() => navigate({ to: `/reports/sales/${sale.id}` })}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{sale.shop.name}</TableCell>
                  <TableCell>{sale.saleType}</TableCell>
                  <TableCell>
                    Rs.{" "}
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
                  <TableCell>
                    Rs.{" "}
                    {sale.saleItems
                      ? (
                          sale.saleItems.reduce(
                            (sum: number, item: any) =>
                              sum + item.price * item.quantity,
                            0,
                          ) *
                          (1 - (sale.discount ?? 0) / 100)
                        ).toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {sale.saleItems
                      ? sale.saleItems.reduce(
                          (sum: number, item: any) => sum + item.quantity,
                          0,
                        )
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {new Date(sale.saleTime).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export const Route = createFileRoute("/reports/sales/")({
  component: SalesReport,
});
