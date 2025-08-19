import { useStore } from "../../../context/StoreContext";
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
import { useAdminGuard } from "../../../hooks/useAdminGuard";

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7days", label: "Last 7 Days" },
  { value: "thismonth", label: "This Month" },
  { value: "lastmonth", label: "Last Month" },
  { value: "thisyear", label: "This Year" },
  { value: "alltime", label: "All Time" },
];

const fetchShopSales = async (storeId: number, period: string) => {
  const res = await fetch(
    `http://localhost:3001/api/shops/sales?storeId=${storeId}&period=${period}`,
  );
  return res.json();
};

function ShopsReportPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const [period, setPeriod] = useState<string>("thismonth");

  const {
    data: shops,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shopSales", activeStore?.id, period],
    queryFn: () => fetchShopSales(activeStore!.id, period),
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
        <Typography variant="h5">Shops Sales Report</Typography>
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
        <Typography color="error">Error loading shops</Typography>
      ) : !shops || shops.length === 0 ? (
        <Typography>No shops found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shop Name</TableCell>
                <TableCell>Units Sold</TableCell>
                <TableCell>Money Made</TableCell>
                <TableCell>Most Sold Item</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shops.map((shop: any) => (
                <TableRow key={shop.id}>
                  <TableCell>{shop.name}</TableCell>
                  <TableCell>{shop.unitsSold}</TableCell>
                  <TableCell>
                    Rs. {shop.amountMade ? shop.amountMade.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    {shop.mostSoldItem ? shop.mostSoldItem : "-"}
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

export const Route = createFileRoute("/reports/shops/")({
  component: ShopsReportPage,
});
