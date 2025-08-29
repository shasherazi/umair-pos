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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SentimentDissatisfiedIcon from "@mui/icons-material/SentimentDissatisfied";
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

const fetchSales = async (storeId: number, period: string) => {
  const res = await fetch(
    `http://localhost:3001/api/sales/report?storeId=${storeId}&period=${period}`,
  );
  return res.json();
};

function SalesReport() {
  const navigate = useNavigate();
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<string>("thismonth");

  const {
    data: sales,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sales", activeStore?.id, period],
    queryFn: () => fetchSales(activeStore!.id, period),
    enabled: !!activeStore,
  });

  return (
    <Box sx={{ mx: "auto", mt: 4, p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        mb={2}
      >
        <Typography variant="h5">
          {activeStore ? `Sales for ${activeStore.name}` : "Sales"}
        </Typography>
        <Stack direction="row" spacing={2}>
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate({ to: "/reports/sales/new" })}
          >
            Add Sale
          </Button>
        </Stack>
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Error loading sales</Typography>
      ) : !sales || sales.length === 0 ? (
        <Box textAlign="center" mt={6}>
          <SentimentDissatisfiedIcon color="disabled" sx={{ fontSize: 60 }} />
          <Typography variant="h6" mt={2}>
            No sales in this period yet.
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
              {sales.map((sale: any) => (
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
