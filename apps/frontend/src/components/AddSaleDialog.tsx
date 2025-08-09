import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
  Typography,
  Box,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { useStore } from "../context/StoreContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type Product = {
  id: number;
  name: string;
  price: number;
};

type SaleItemInput = {
  productId: number;
  quantity: number;
};

type AddSaleDialogProps = {
  open: boolean;
  onClose: () => void;
  onSaleAdded: () => void;
};

export const AddSaleDialog: React.FC<AddSaleDialogProps> = ({
  open,
  onClose,
  onSaleAdded,
}) => {
  const { activeStore } = useStore();
  const [items, setItems] = useState<SaleItemInput[]>([
    { productId: 0, quantity: 1 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products for the active store
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products", activeStore?.id],
    queryFn: async () => {
      if (!activeStore) return [];
      const res = await axios.get(
        `http://localhost:3001/api/stores/${activeStore.id}/products`,
      );
      return res.data;
    },
    enabled: !!activeStore,
  });

  const handleItemChange = (
    idx: number,
    field: keyof SaleItemInput,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await axios.post("http://localhost:3001/api/sales", {
        storeId: activeStore?.id,
        items: items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
        })),
        discount: Number(discount),
      });
      setLoading(false);
      onSaleAdded();
      onClose();
      setItems([{ productId: 0, quantity: 1 }]);
      setDiscount(0);
    } catch (e: any) {
      setLoading(false);
      setError(e?.response?.data?.error || "Failed to add sale");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Sale</DialogTitle>
      <DialogContent>
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}
        {items.map((item, idx) => (
          <Box
            key={idx}
            display="flex"
            alignItems="center"
            mb={2}
            mt={2}
            gap={2}
          >
            <TextField
              select
              label="Product"
              value={item.productId}
              onChange={(e) =>
                handleItemChange(idx, "productId", e.target.value)
              }
              sx={{ minWidth: 180 }}
              disabled={productsLoading}
            >
              <MenuItem value={0} disabled>
                Select product
              </MenuItem>
              {products?.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name} (Rs. {product.price})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(
                  idx,
                  "quantity",
                  Math.max(1, Number(e.target.value)),
                )
              }
              sx={{ width: 170 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleItemChange(
                            idx,
                            "quantity",
                            Math.max(1, item.quantity - 1),
                          )
                        }
                      >
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleItemChange(idx, "quantity", item.quantity + 1)
                        }
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  min: 1,
                },
              }}
            />
            {items.length > 1 && (
              <IconButton
                color="error"
                onClick={() => handleRemoveItem(idx)}
                size="small"
              >
                <RemoveIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <Button
          onClick={handleAddItem}
          startIcon={<AddIcon />}
          sx={{ mb: 2 }}
          disabled={productsLoading}
        >
          Add Product
        </Button>
        <TextField
          label="Discount (%)"
          type="number"
          value={discount}
          onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
          sx={{ width: 180, ml: 2 }}
          slotProps={{
            htmlInput: {
              min: 0,
              max: 100,
            },
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || items.some((item) => item.productId === 0)}
        >
          {loading ? "Adding..." : "Add Sale"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
