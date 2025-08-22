import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
  CircularProgress,
  Button,
  Stack,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAdminGuard } from "../../hooks/useAdminGuard";
import { formatMoney } from "@shared/utils/formatMoney";

const fetchSalesmen = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/salesmen`,
  );
  return res.json();
};

function SalesmenPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const navigate = useNavigate();

  const {
    data: salesmen,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["salesmen", activeStore?.id],
    queryFn: () => fetchSalesmen(activeStore!.id),
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
        <Typography variant="h5">Salesmen</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: "/salesmen/new" })}
        >
          Add new salesman
        </Button>
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Error loading salesmen</Typography>
      ) : !salesmen || salesmen.length === 0 ? (
        <Typography>No salesmen found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Salesman Name</TableCell>
                <TableCell>Total Units Sold</TableCell>
                <TableCell>Total Sales Made</TableCell>
                <TableCell>Total Credit Remaining</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salesmen.map((salesman: any) => (
                <TableRow
                  key={salesman.id}
                  onClick={() => navigate({ to: `/salesmen/${salesman.id}` })}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell>{salesman.name}</TableCell>
                  <TableCell>{formatMoney(salesman.unitsSold)}</TableCell>
                  <TableCell>
                    Rs.{" "}
                    {salesman.totalSales
                      ? formatMoney(salesman.totalSales)
                      : "0.00"}
                  </TableCell>
                  <TableCell>
                    Rs.{" "}
                    {salesman.totalCredit
                      ? formatMoney(salesman.totalCredit)
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

export const Route = createFileRoute("/salesmen/")({
  component: SalesmenPage,
});
