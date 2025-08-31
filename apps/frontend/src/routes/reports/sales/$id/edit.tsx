import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState, useEffect } from "react";
import { formatMoney } from "@shared/utils/formatMoney";

const fetchSale = async (id: string) => {
  const res = await fetch(`http://localhost:3001/api/sales/${id}`);
  if (!res.ok) throw new Error("Sale not found");
  return res.json();
};

const fetchProducts = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/products`,
  );
  return res.json();
};

const fetchSalesmen = async (storeId: number) => {
  const res = await fetch(
    `http://localhost:3001/api/stores/${storeId}/salesmen`,
  );
  return res.json();
};

const fetchShops = async (storeId: number) => {
  const res = await fetch(`http://localhost:3001/api/stores/${storeId}/shops`);
  return res.json();
};

function SaleEditPage() {
  const { id } = useParams({ from: "/reports/sales/$id/edit" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: sale,
    isLoading: saleLoading,
    error: saleError,
  } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => fetchSale(id),
  });

  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", sale?.storeId],
    queryFn: () => fetchProducts(sale?.storeId),
    enabled: !!sale,
  });

  const {
    data: salesmen,
    isLoading: salesmenLoading,
    error: salesmenError,
  } = useQuery({
    queryKey: ["salesmen", sale?.storeId],
    queryFn: () => fetchSalesmen(sale?.storeId),
    enabled: !!sale,
  });

  const {
    data: shops,
    isLoading: shopsLoading,
    error: shopsError,
  } = useQuery({
    queryKey: ["shops", sale?.storeId],
    queryFn: () => fetchShops(sale?.storeId),
    enabled: !!sale,
  });

  // Form state
  const [form, setForm] = useState<{
    items: { productId: number; quantity: number; price: number }[];
    discount: number;
    saleType: "CASH" | "CREDIT";
    salesmanId: number;
    shopId: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Initialize form with sale data
  useEffect(() => {
    if (sale) {
      setForm({
        items: sale.saleItems.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        discount: sale.discount ?? 0,
        saleType: sale.saleType,
        salesmanId: sale.salesmanId,
        shopId: sale.shopId,
      });
    }
  }, [sale]);

  // Add product to sale
  const handleAddProduct = () => {
    if (!products) return;
    // Add first product not already in the list
    const available = products.filter(
      (p: any) => !form?.items.some((i) => i.productId === p.id),
    );
    if (available.length > 0) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              items: [
                ...prev.items,
                {
                  productId: available[0].id,
                  quantity: 1,
                  price: available[0].price,
                },
              ],
            }
          : prev,
      );
    }
  };

  // Remove product from sale
  const handleRemoveProduct = (productId: number) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.filter((i) => i.productId !== productId),
          }
        : prev,
    );
  };

  // Update product quantity/price
  const handleItemChange = (
    idx: number,
    field: "quantity" | "price" | "productId",
    value: number,
  ) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item, i) =>
              i === idx ? { ...item, [field]: value } : item,
            ),
          }
        : prev,
    );
  };

  // PATCH mutation
  const mutation = useMutation({
    mutationFn: async () => {
      if (!form) throw new Error("Form not ready");
      const res = await fetch(`http://localhost:3001/api/sales/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update sale");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      navigate({ to: `/reports/sales/${id}` });
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update sale");
    },
  });

  if (saleLoading || productsLoading || salesmenLoading || shopsLoading)
    return <CircularProgress />;
  if (saleError || !sale)
    return <Typography color="error">Sale not found.</Typography>;
  if (productsError)
    return <Typography color="error">Error loading products.</Typography>;
  if (salesmenError)
    return <Typography color="error">Error loading salesmen.</Typography>;
  if (shopsError)
    return <Typography color="error">Error loading shops.</Typography>;
  if (!form) return null;

  // Calculate totals
  const saleDiscount = form.discount ?? 0;
  const totalGross = form.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalDiscount = totalGross * (saleDiscount / 100);
  const totalNet = totalGross - totalDiscount;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 4, p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" mb={2}>
          Edit Sale #{sale.id}
        </Typography>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="shop-label">Shop</InputLabel>
              <Select
                labelId="shop-label"
                value={form.shopId}
                label="Shop"
                onChange={(e) =>
                  setForm((prev) =>
                    prev ? { ...prev, shopId: Number(e.target.value) } : prev,
                  )
                }
              >
                {shops?.map((shop: any) => (
                  <MenuItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="salesman-label">Salesman</InputLabel>
              <Select
                labelId="salesman-label"
                value={form.salesmanId}
                label="Salesman"
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? { ...prev, salesmanId: Number(e.target.value) }
                      : prev,
                  )
                }
              >
                {salesmen?.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="sale-type-label">Sale Type</InputLabel>
              <Select
                labelId="sale-type-label"
                value={form.saleType}
                label="Sale Type"
                onChange={(e) =>
                  setForm((prev) =>
                    prev
                      ? {
                          ...prev,
                          saleType: e.target.value as "CASH" | "CREDIT",
                        }
                      : prev,
                  )
                }
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CREDIT">Credit</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Discount (%)"
              type="number"
              value={form.discount}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, discount: Number(e.target.value) } : prev,
                )
              }
              sx={{ width: 120 }}
              slotProps={{ htmlInput: { min: 0, max: 100 } }}
            />
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Remove</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.map((item, idx) => {
                  const product = products?.find(
                    (p: any) => p.id === item.productId,
                  );
                  return (
                    <TableRow key={item.productId}>
                      <TableCell>
                        <FormControl fullWidth>
                          <Select
                            value={item.productId}
                            onChange={(e) => {
                              const newProductId = Number(e.target.value);
                              const newProduct = products?.find(
                                (p: any) => p.id === newProductId,
                              );
                              handleItemChange(idx, "productId", newProductId);
                              // Auto-update price when product changes
                              if (newProduct) {
                                handleItemChange(
                                  idx,
                                  "price",
                                  newProduct.price,
                                );
                              }
                            }}
                          >
                            {products?.map((p: any) => (
                              <MenuItem
                                key={p.id}
                                value={p.id}
                                disabled={form.items.some(
                                  (i, iidx) =>
                                    i.productId === p.id && iidx !== idx,
                                )}
                              >
                                {p.name} (Stock: {p.stock})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "quantity",
                              Math.max(1, Number(e.target.value)),
                            )
                          }
                          slotProps={{ htmlInput: { min: 1 } }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "price",
                              Math.max(0, Number(e.target.value)),
                            )
                          }
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        Rs. {formatMoney(item.price * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveProduct(item.productId)}
                          disabled={form.items.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddProduct}
                      disabled={
                        !products ||
                        products.length === 0 ||
                        form.items.length === products.length
                      }
                    >
                      Add Product
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {/* Totals */}
          <Stack direction="row" spacing={4} mt={2}>
            <Typography>
              <b>Gross:</b> Rs. {formatMoney(totalGross)}
            </Typography>
            <Typography>
              <b>Discount:</b> Rs. {formatMoney(totalDiscount)}
            </Typography>
            <Typography>
              <b>Net:</b> Rs. {formatMoney(totalNet)}
            </Typography>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          <Stack direction="row" spacing={2} mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate({ to: `/reports/sales/${sale.id}` })}
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export const Route = createFileRoute("/reports/sales/$id/edit")({
  component: SaleEditPage,
});
