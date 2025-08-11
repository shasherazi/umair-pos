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

const fetchShops = async (storeId: number) => {
  const res = await fetch(`http://localhost:3001/api/stores/${storeId}/shops`);
  return res.json();
};

function ShopsPage() {
  const { activeStore } = useStore();
  const navigate = useNavigate();

  const {
    data: shops,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shops", activeStore?.id],
    queryFn: () => fetchShops(activeStore!.id),
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
        <Typography variant="h5"> Shops </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate({ to: "/shops/new" })}
        >
          Add new shop
        </Button>
      </Stack>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error"> Error loading shops </Typography>
      ) : !shops || shops.length === 0 ? (
        <Typography>No shops found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shop Name </TableCell>
                <TableCell> Total Cash Paid </TableCell>
                <TableCell> Total Credit </TableCell>
                <TableCell> First Sale Date </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shops.map((shop: any) => (
                <TableRow
                  key={shop.id}
                  onClick={() => navigate({ to: `/shops/${shop.id}` })}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell>{shop.name} </TableCell>
                  <TableCell>
                    Rs. {shop.cashPaid ? shop.cashPaid.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    Rs. {shop.credit ? shop.credit.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    {shop.firstSaleDate
                      ? new Date(shop.firstSaleDate).toLocaleString()
                      : "-"}
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

export const Route = createFileRoute("/shops/")({
  component: ShopsPage,
});
