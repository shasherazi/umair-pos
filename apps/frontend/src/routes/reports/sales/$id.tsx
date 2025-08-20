import PrintIcon from "@mui/icons-material/Print";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const fetchSale = async (id: string) => {
  const res = await fetch(`http://localhost:3001/api/sales/${id}`);
  if (!res.ok) throw new Error("Sale not found");
  return res.json();
};

function SaleDetails() {
  const { id } = useParams({ from: "/reports/sales/$id" });
  const navigate = useNavigate();

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sale", id],
    queryFn: () => fetchSale(id),
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (error || !sale)
    return <Typography color="error">Sale not found.</Typography>;

  // Calculate totals
  const totalBeforeDiscount = sale.saleItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );
  const discountAmount = (totalBeforeDiscount * (sale.discount ?? 0)) / 100;
  const grandTotal = totalBeforeDiscount - discountAmount;

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

  return (
    <Box sx={{ mx: "auto", mt: 4, p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate({ to: "/reports/sales" })}
        >
          Back to Sales
        </Button>
        <Typography variant="h5" flexGrow={1}>
          Sale Receipt #{sale.id}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ ml: "auto" }}
        >
          Export as PDF
        </Button>
      </Stack>
      <Typography variant="subtitle1" mb={1}>
        Date: {new Date(sale.saleTime).toLocaleString()}
      </Typography>
      <Typography variant="subtitle2" mb={2}>
        Store ID: {sale.storeId}
      </Typography>
      <Typography variant="subtitle2" mb={2}>
        Shop name: {sale.shop.name}
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Market Price</TableCell>
              <TableCell>Sale Price</TableCell>
              <TableCell>Discounted Price</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell align="right">Subtotal</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sale.saleItems.map((item: any) => {
              const marketPrice = item.product.price;
              const salePrice = item.price;
              const discountedPrice =
                sale.discount > 0
                  ? (salePrice * (1 - sale.discount / 100)).toFixed(2)
                  : salePrice.toFixed(2);
              const subtotal = salePrice * item.quantity;
              const discountedSubtotal =
                sale.discount > 0
                  ? (subtotal * (1 - sale.discount / 100)).toFixed(2)
                  : subtotal.toFixed(2);

              return (
                <TableRow key={item.id}>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>Rs. {marketPrice.toFixed(2)}</TableCell>
                  <TableCell>Rs. {salePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {sale.discount > 0 ? `Rs. ${discountedPrice}` : "-"}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell align="right">
                    Rs.{" "}
                    {sale.discount > 0
                      ? discountedSubtotal
                      : subtotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
            {/* Totals */}
            <TableRow>
              <TableCell colSpan={5} align="right">
                <b>Total (before discount):</b>
              </TableCell>
              <TableCell align="right">
                <b>Rs. {totalBeforeDiscount.toFixed(2)}</b>
              </TableCell>
            </TableRow>
            {sale.discount > 0 && (
              <TableRow>
                <TableCell colSpan={5} align="right">
                  <b>Discount ({sale.discount}%):</b>
                </TableCell>
                <TableCell align="right">
                  <b>- Rs. {discountAmount.toFixed(2)}</b>
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={5} align="right">
                <b>Grand Total:</b>
              </TableCell>
              <TableCell align="right">
                <b>Rs. {grandTotal.toFixed(2)}</b>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export const Route = createFileRoute("/reports/sales/$id")({
  component: SaleDetails,
});
