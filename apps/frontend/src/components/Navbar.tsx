import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import { useStore } from "../context/StoreContext";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export const Navbar: React.FC = () => {
  const { activeStore } = useStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!activeStore) return null;

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget as HTMLElement);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const menuOpen = Boolean(anchorEl);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            alignItems: "flex-start",
            display: "flex",
            textDecoration: "none",
            color: "inherit",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          <StorefrontIcon sx={{ mr: 1 }} /> {activeStore.name}
        </Typography>

        {/* Sales Dropdown */}
        <Box sx={{ display: "inline-block" }}>
          <Button
            color="inherit"
            endIcon={menuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ textTransform: "none" }}
            aria-controls={menuOpen ? "sales-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            onClick={handleMenuOpen}
          >
            Sales
          </Button>
          <Menu
            id="sales-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            slotProps={{
              list: {
                // No hover handlers needed
              },
            }}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuItem
              component={Link}
              to="/reports/sales"
              onClick={handleMenuClose}
              sx={{ textDecoration: "underline" }}
            >
              Time-wise
            </MenuItem>
            <MenuItem
              component={Link}
              to="/reports/shops"
              onClick={handleMenuClose}
              sx={{ textDecoration: "underline" }}
            >
              Shop-wise
            </MenuItem>
            <MenuItem
              component={Link}
              to="/reports/products"
              onClick={handleMenuClose}
              sx={{ textDecoration: "underline" }}
            >
              Product-wise
            </MenuItem>
          </Menu>
        </Box>

        {/* Other Links */}
        <Button
          color="inherit"
          component={Link}
          to="/shops"
          sx={{ textTransform: "none", textDecoration: "underline" }}
        >
          Shops
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/inventory"
          sx={{ textTransform: "none", textDecoration: "underline" }}
        >
          Inventory
        </Button>
      </Toolbar>
    </AppBar>
  );
};
