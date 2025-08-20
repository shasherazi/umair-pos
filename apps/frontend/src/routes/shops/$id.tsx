import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TextField,
  Button,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import { shopPatchSchema } from "@shared/validation/shop";
import { useAdminGuard } from "../../hooks/useAdminGuard";

// Fetch shop details and sales stats
const fetchShopDetails = async (storeId: number, shopId: number) => {
  // Get shop info
  const shopRes = await fetch(`http://localhost:3001/api/shops/${shopId}`);
  if (!shopRes.ok) throw new Error("Shop not found");
  const shop = await shopRes.json();

  // Get sales stats for this shop (all time)
  const salesRes = await fetch(
    `http://localhost:3001/api/shops/sales?storeId=${storeId}`,
  );
  const salesStatsArr = await salesRes.json();
  // Find this shop's stats
  const stats =
    Array.isArray(salesStatsArr) && salesStatsArr.length > 0
      ? salesStatsArr.find((s: any) => s.id === shopId) || {
          unitsSold: 0,
          amountMade: 0,
          mostSoldItem: null,
        }
      : { unitsSold: 0, amountMade: 0, mostSoldItem: null };

  return { ...shop, ...stats };
};

function ShopDetailsPage() {
  useAdminGuard();
  const { activeStore } = useStore();
  const { id } = useParams({ from: "/shops/$id" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const shopId = Number(id);

  const {
    data: shop,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["shopDetails", activeStore?.id, shopId],
    queryFn: () => fetchShopDetails(activeStore!.id, shopId),
    enabled: !!activeStore && !!shopId,
  });

  // Form state
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [creditDecrease, setCreditDecrease] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);

  // PATCH mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {};

      if (name !== "" && name !== shop.name) payload.name = name.trim();
      if (address !== "" && address !== shop.address)
        payload.address = address.trim();
      if (phone !== "" && phone !== shop.phone) payload.phone = phone.trim();

      if (creditDecrease !== "") {
        const creditNum = Number(creditDecrease);
        const parseResult = shopPatchSchema.safeParse({
          creditDecrease: creditNum,
        });
        if (!parseResult.success) {
          throw new Error(
            parseResult.error.issues.map((i) => i.message).join(", "),
          );
        }
        payload.creditDecrease = creditNum;
      }
      if (Object.keys(payload).length === 0) {
        throw new Error("No changes to update");
      }
      const res = await fetch(`http://localhost:3001/api/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update shop");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shopDetails", activeStore?.id, shopId],
      });
      setEditError(null);
      setName("");
      setCreditDecrease("");
    },
    onError: (err: any) => {
      setEditError(err.message || "Failed to update shop");
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error || !shop)
    return <Typography color="error">Shop not found.</Typography>;

  return (
    <Box sx={{ mx: "auto", mt: 4, p: 2 }}>
      <Typography variant="h5" mb={2}>
        Shop Details
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Shop Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Units Sold</TableCell>
              <TableCell>Money Made</TableCell>
              <TableCell>Most Sold Item</TableCell>
              <TableCell>Cash Paid</TableCell>
              <TableCell>Credit</TableCell>
              <TableCell>First Sale Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{shop.name}</TableCell>
              <TableCell>{shop.address}</TableCell>
              <TableCell>{shop.phone}</TableCell>
              <TableCell>{shop.unitsSold ?? 0}</TableCell>
              <TableCell>
                Rs. {shop.amountMade ? shop.amountMade.toFixed(2) : "0.00"}
              </TableCell>
              <TableCell>
                {shop.mostSoldItem ? shop.mostSoldItem : "-"}
              </TableCell>
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
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" mb={1}>
        Edit Shop
      </Typography>
      <Stack spacing={2} mb={2}>
        <TextField
          label="Shop Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={shop.name}
        />
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={shop.address}
        />
        <TextField
          label="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={shop.phone}
        />
        <TextField
          label={`Decrease Credit (current: Rs. ${shop.credit ? shop.credit.toFixed(2) : "0.00"})`}
          type="number"
          value={creditDecrease}
          onChange={(e) => {
            // Only allow decrease up to current credit
            const val = Number(e.target.value);
            if (val < 0) {
              setCreditDecrease("");
            } else if (val > shop.credit) {
              setCreditDecrease(shop.credit.toString());
            } else {
              setCreditDecrease(e.target.value);
            }
          }}
          slotProps={{ htmlInput: { step: 1, min: 0, max: shop.credit } }}
          helperText="Enter amount to decrease credit. Cannot decrease below zero."
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
      <Button variant="outlined" onClick={() => navigate({ to: "/shops" })}>
        Back to Shops
      </Button>
    </Box>
  );
}

export const Route = createFileRoute("/shops/$id")({
  component: ShopDetailsPage,
});
