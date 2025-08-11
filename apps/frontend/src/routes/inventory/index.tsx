import { createFileRoute } from "@tanstack/react-router";
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
} from "@mui/material";

const fetchInventory = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/products`,
  );
  return res.json();
};

function InventoryPage() {
  const { activeStore } = useStore();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", activeStore?.id],
    queryFn: () => fetchInventory(activeStore!.id),
    enabled: !!activeStore,
  });

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" mb={2}>
        Inventory
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">Error loading inventory</Typography>
      ) : !products || products.length === 0 ? (
        <Typography>No products found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Units in Stock</TableCell>
                <TableCell>Total Stock Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>Rs. {product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    Rs. {(product.stock * product.price).toFixed(2)}
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

export const Route = createFileRoute("/inventory/")({
  component: InventoryPage,
});
