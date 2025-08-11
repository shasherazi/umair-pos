import { useStore } from "../../context/StoreContext";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
  { value: "thisyear", label: "This Year" },
  { value: "alltime", label: "All Time" },
];

const fetchProductSales = async (storeId: number, period: string) => {
  const res = await fetch(
    `http://localhost:3001/api/products/sales?storeId=${storeId}&period=${period}`,
  );
  return res.json();
};

function ProductsPage() {
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<string>("thismonth");

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productSales", activeStore?.id, period],
    queryFn: () => fetchProductSales(activeStore!.id, period),
    enabled: !!activeStore,
  });

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        mb={2}
      >
        <Typography variant="h5">Products Sales Report</Typography>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="period-label">Period</InputLabel>
          <Select
            labelId="period-label"
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Error loading products</Typography>
      ) : !products || products.length === 0 ? (
        <Typography>No products found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Units Sold</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Amount Made</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.unitsSold}</TableCell>
                  <TableCell>Rs. {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    Rs.{" "}
                    {product.amountMade
                      ? product.amountMade.toFixed(2)
                      : "0.00"}
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

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
});
