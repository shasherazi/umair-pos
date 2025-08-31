import PrintIcon from "@mui/icons-material/Print";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  createFileRoute,
  useParams,
  useNavigate,
} from "@tanstack/react-router";
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
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useState } from "react";
import { formatMoney } from "@shared/utils/formatMoney";

const fetchSale = async (id: string) => {
  const res = await fetch(`http://localhost:3001/api/sales/${id}`);
  if (!res.ok) throw new Error("Sale not found");
  return res.json();
};

function SaleDetails() {
  const { id } = useParams({ from: "/reports/sales/$id/" });
  const navigate = useNavigate();

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => fetchSale(id),
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error || !sale)
    return <Typography color="error">Sale not found.</Typography>;

  // Totals
  const saleDiscount = sale.discount ?? 0;
  const totalQuantity = sale.saleItems.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0,
  );
  const totalGross = sale.saleItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );
  const totalDiscount = totalGross * (saleDiscount / 100);
  const totalNet = totalGross - totalDiscount;

  // Check if sale is from today
  const isSameDay = (() => {
    const saleDate = new Date(sale.saleTime);
    const now = new Date();
    return (
      saleDate.getFullYear() === now.getFullYear() &&
      saleDate.getMonth() === now.getMonth() &&
      saleDate.getDate() === now.getDate()
    );
  })();

  const handlePrint = () => {
    fetch(`http://localhost:3001/api/sales/${sale.id}/invoice-pdf`, {
      method: "GET",
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${sale.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    try {
      const res = await fetch(`http://localhost:3001/api/sales/${sale.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete sale");
      }
      // Optionally, show a success message or toast here
      navigate({ to: "/reports/sales" });
    } catch (err: any) {
      // Optionally, show an error message or toast here
      alert(err.message || "Failed to delete sale");
    }
  };

  return (
    <Box sx={{ mx: "auto", mt: 4, p: 2, maxWidth: 1000 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate({ to: "/reports/sales" })}
        >
          Back to Sales
        </Button>
        <Typography variant="h5" flexGrow={1}>
          Invoice #{sale.id}
        </Typography>
        {isSameDay && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate({ to: `/reports/sales/${sale.id}/edit` })}
          >
            Edit
          </Button>
        )}
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ ml: "auto" }}
        >
          Export as PDF
        </Button>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this sale? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header Info */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {sale.shop.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {sale.shop.address}
        </Typography>
        {sale.shop.phone && (
          <Typography variant="body2" color="text.secondary">
            Phone: {sale.shop.phone}
          </Typography>
        )}
        <Stack direction="row" spacing={4} mt={1}>
          <Typography variant="body2">
            <b>Date:</b> {new Date(sale.saleTime).toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <b>Salesman:</b> {sale.salesman.name}
          </Typography>
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sr. No.</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>TP Rate</TableCell>
              <TableCell>Gross Amount</TableCell>
              <TableCell>Discount</TableCell>
              <TableCell>Net Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.saleItems.map((item: any, idx: number) => {
              const grossAmount = item.price * item.quantity;
              const discountAmount = grossAmount * (saleDiscount / 100);
              const netAmount = grossAmount - discountAmount;
              return (
                <TableRow key={item.id}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>Rs. {formatMoney(item.price)}</TableCell>
                  <TableCell>Rs. {formatMoney(grossAmount)}</TableCell>
                  <TableCell>
                    Rs. {formatMoney(discountAmount)}
                    {saleDiscount > 0 && ` (${saleDiscount}%)`}
                  </TableCell>
                  <TableCell>Rs. {formatMoney(netAmount)}</TableCell>
                </TableRow>
              );
            })}
            {/* Grand Total Row */}
            <TableRow>
              <TableCell colSpan={2} align="left">
                <b>{sale.saleItems.length} items</b>
              </TableCell>
              <TableCell>
                <b>{totalQuantity}</b>
              </TableCell>
              <TableCell />
              <TableCell>
                <b>Rs. {formatMoney(totalGross)}</b>
              </TableCell>
              <TableCell>
                <b>Rs. {formatMoney(totalDiscount)}</b>
              </TableCell>
              <TableCell>
                <b>Rs. {formatMoney(totalNet)}</b>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export const Route = createFileRoute("/reports/sales/$id/")({
  component: SaleDetails,
});
