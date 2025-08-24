import PrintIcon from "@mui/icons-material/Print";
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

const fetchInventory = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/products`,
  );
  return res.json();
};

function InventoryPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const navigate = useNavigate();

  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", activeStore?.id],
    queryFn: () => fetchInventory(activeStore!.id),
    enabled: !!activeStore,
  });

  const sortedProducts = products
    ? [...products].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const handleExportPdf = () => {
    fetch(`http://localhost:3001/api/products/${activeStore!.id}/pdf`, {
      method: "GET",
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory-${activeStore!.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        mb={2}
      >
        <Typography variant="h5">Inventory</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate({ to: "/inventory/new" })}
          >
            Add new item
          </Button>
          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handleExportPdf}
          >
            Export to PDF
          </Button>
        </Stack>
      </Stack>

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
              {sortedProducts.map((product: any) => (
                <TableRow
                  key={product.id}
                  onClick={() => navigate({ to: `/inventory/${product.id}` })}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                  }}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>Rs. {product.price.toFixed(2)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    Rs. {formatMoney(product.stock * product.price)}
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
