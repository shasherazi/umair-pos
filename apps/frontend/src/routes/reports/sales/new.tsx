import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "../../../context/StoreContext";
import {
  saleCreateSchema,
  type SaleCreateInput,
} from "@shared/validation/sale";
import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  IconButton,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";

const fetchProducts = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/products`,
  );
  return res.json();
};

const fetchShops = async (storeId: number) => {
  const res = await fetch(`http://localhost:3001/api/stores/${storeId}/shops`);
  return res.json();
};

function NewSale() {
  const { activeStore } = useStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [saleType, setSaleType] = useState<"CASH" | "CREDIT">("CASH");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [inputValue, setInputValue] = useState(""); // For product Autocomplete
  const [selectedShop, setSelectedShop] = useState<any | null>(null);
  const [shopInputValue, setShopInputValue] = useState(""); // For shop Autocomplete

  // Fetch products for the active store
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products", activeStore?.id],
    queryFn: () => fetchProducts(activeStore!.id),
    enabled: !!activeStore,
  });

  // Fetch shops for the active store
  const { data: shops, isLoading: shopsLoading } = useQuery({
    queryKey: ["shops", activeStore?.id],
    queryFn: () => fetchShops(activeStore!.id),
    enabled: !!activeStore,
  });

  // Add product to selected list
  const handleAddProduct = (product: any) => {
    if (!selectedProducts.find((p) => p.id === product.id)) {
      setSelectedProducts([
        ...selectedProducts,
        { ...product, quantity: 1, salePrice: product.price },
      ]);
    }
  };

  // Remove product from selected list
  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  // Update quantity or price
  const handleEdit = (
    id: number,
    field: "quantity" | "salePrice",
    value: number,
  ) => {
    setSelectedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  // Get stock for a product
  const getProductStock = (id: number) => {
    const product = products?.find((p: any) => p.id === id);
    return product ? product.stock : 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedShop) throw new Error("Shop is required");

      const payload: SaleCreateInput = {
        storeId: activeStore!.id,
        shopId: selectedShop.id,
        items: selectedProducts.map((p) => ({
          productId: p.id,
          quantity: p.quantity,
          price: p.salePrice,
        })),
        discount,
        saleType,
      };

      const parseResult = saleCreateSchema.safeParse(payload);

      if (!parseResult.success) {
        throw new Error(
          "Validation error: " + JSON.stringify(parseResult.error.issues),
        );
      }

      const res = await fetch("http://localhost:3001/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add sale");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentMonthSales"] });
      navigate({ to: `/reports/sales/${data.id}` });
    },
  });

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" mb={2}>
        Add Sale for {activeStore?.name}
      </Typography>

      <Autocomplete
        options={shops || []}
        getOptionLabel={(option: any) => option.name}
        loading={shopsLoading}
        value={selectedShop}
        onChange={(_, value) => setSelectedShop(value)}
        inputValue={shopInputValue}
        onInputChange={(_, newInputValue) => setShopInputValue(newInputValue)}
        clearOnBlur
        clearOnEscape
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select shop"
            variant="outlined"
            required
          />
        )}
        sx={{ mb: 2 }}
      />

      <Autocomplete
        options={products || []}
        getOptionLabel={(option: any) => option.name}
        loading={productsLoading}
        onChange={(_, value) => {
          if (value) handleAddProduct(value);
          setInputValue(""); // Clear search bar after adding
        }}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
        clearOnBlur
        clearOnEscape
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search and add product"
            variant="outlined"
          />
        )}
        sx={{ mb: 2 }}
      />

      <FormLabel component="legend" sx={{ mt: 2 }}>
        Sale Type
      </FormLabel>
      <RadioGroup
        row
        value={saleType}
        onChange={(e) => setSaleType(e.target.value as "CASH" | "CREDIT")}
        sx={{ mb: 2 }}
      >
        <FormControlLabel value="CASH" control={<Radio />} label="Cash" />
        <FormControlLabel value="CREDIT" control={<Radio />} label="Credit" />
      </RadioGroup>

      {selectedProducts.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Remaining</TableCell>
                <TableCell>Price</TableCell>
                <TableCell align="right">Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {selectedProducts.map((p) => {
                const stock = getProductStock(p.id);
                const remaining = stock - p.quantity;
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{stock}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={p.quantity}
                        slotProps={{ htmlInput: { min: 0, max: stock } }}
                        onChange={(e) =>
                          handleEdit(
                            p.id,
                            "quantity",
                            Math.max(
                              0,
                              Math.min(Number(e.target.value), stock),
                            ),
                          )
                        }
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>{remaining >= 0 ? remaining : 0}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={p.salePrice}
                        onChange={(e) =>
                          handleEdit(
                            p.id,
                            "salePrice",
                            Math.max(0, Number(e.target.value)),
                          )
                        }
                        sx={{ width: 100 }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                $
                              </InputAdornment>
                            ),
                          },
                          htmlInput: { min: 0 },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleRemoveProduct(p.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <TextField
          label="Discount (%)"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
          sx={{ width: 150 }}
          slotProps={{
            htmlInput: { min: 0, max: 100 },
          }}
        />
        <Typography variant="body2" color="text.secondary">
          (applies to total)
        </Typography>
      </Stack>

      <Button
        variant="contained"
        color="primary"
        disabled={
          !selectedShop ||
          selectedProducts.length === 0 ||
          mutation.isPending ||
          selectedProducts.some(
            (p) => p.quantity > getProductStock(p.id) || p.quantity < 1,
          )
        }
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? "Adding..." : "Add Sale"}
      </Button>
    </Box>
  );
}

export const Route = createFileRoute("/reports/sales/new")({
  component: NewSale,
});
