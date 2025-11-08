import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../../context/StoreContext";
import { productPatchSchema } from "@shared/validation/product";
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
import { formatMoney } from "@shared/utils/formatMoney";

// Fetch product details and sales stats
const fetchProductDetails = async (storeId: number, productId: number) => {
  // Get product info
  const productRes = await fetch(
    `http://localhost:3001/api/products/${productId}`,
  );
  if (!productRes.ok) throw new Error("Product not found");
  const product = await productRes.json();

  // Get sales stats for this product (all time)
  const salesRes = await fetch(
    `http://localhost:3001/api/products/sales?storeId=${storeId}&productId=${productId}&period=alltime`,
  );
  const salesStatsArr = await salesRes.json();
  // If the backend returns an array, find the product by id
  const salesStats =
    Array.isArray(salesStatsArr) && salesStatsArr.length > 0
      ? salesStatsArr.find((p: any) => p.id === productId) || {
          unitsSold: 0,
          amountMade: 0,
        }
      : { unitsSold: 0, amountMade: 0 };

  return { ...product, ...salesStats };
};

function ProductDetailsPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const { id } = useParams({ from: "/inventory/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const productId = Number(id);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["productDetails", activeStore?.id, productId],
    queryFn: () => fetchProductDetails(activeStore!.id, productId),
    enabled: !!activeStore && !!productId,
  });

  // Form state
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [stockChange, setStockChange] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  // PATCH mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (name.trim() !== "" && name !== product.name) {
        payload.name = name.trim();
      }
      if (price !== "") {
        const priceNum = Number(price);
        payload.price = priceNum;
      }
      if (stockChange !== "") {
        const stockNum = Number(stockChange);
        payload.stockChange = stockNum;
      }

      // Zod validation
      const parseResult = productPatchSchema.safeParse(payload);
      if (!parseResult.success) {
        throw new Error(
          parseResult.error.issues.map((i) => i.message).join(", "),
        );
      }

      if (Object.keys(payload).length === 0) {
        throw new Error("No changes to update");
      }
      const res = await fetch(
        `http://localhost:3001/api/products/${productId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["productDetails", activeStore?.id, productId],
      });
      setEditError(null);
      setPrice("");
      setStockChange("");
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update product");
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error || !product)
    return <Typography color="error">Product not found.</Typography>;

  const totalStockValue = product.stock * product.price;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" mb={2}>
        Product Details
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Unit Price</TableCell>
              <TableCell>Units in Stock</TableCell>
              <TableCell>Total Stock Value</TableCell>
              <TableCell>Items Sold</TableCell>
              <TableCell>Money Made</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{product.name}</TableCell>
              <TableCell>Rs. {formatMoney(product.price)}</TableCell>
              <TableCell>{formatMoney(product.stock)}</TableCell>
              <TableCell>Rs. {formatMoney(totalStockValue)}</TableCell>
              <TableCell>{formatMoney(product.unitsSold) ?? 0}</TableCell>
              <TableCell>
                Rs.{" "}
                {product.amountMade ? formatMoney(product.amountMade) : "0.00"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" mb={1}>
        Edit Product
      </Typography>
      <Stack spacing={2} mb={2}>
        <TextField
          label="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Unit Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          label={`Add Stock (current: ${product.stock})`}
          type="number"
          value={stockChange}
          onChange={(e) => {
            // Only allow positive integers
            const val = Number(e.target.value);
            if (val < 0) {
              setStockChange("");
            } else {
              setStockChange(e.target.value);
            }
          }}
          slotProps={{ htmlInput: { step: 1, min: 1 } }}
          helperText="Enter a positive integer to add stock."
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
      <Button variant="outlined" onClick={() => navigate({ to: "/inventory" })}>
        Back to Inventory
      </Button>
    </Box>
  );
}

export const Route = createFileRoute("/inventory/$id")({
  component: ProductDetailsPage,
});
