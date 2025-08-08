import { AppBar, Toolbar, Typography } from "@mui/material";
import { useStore } from "../context/StoreContext";
import StorefrontIcon from "@mui/icons-material/Storefront";

export const Navbar: React.FC = () => {
  const { activeStore } = useStore();

  if (!activeStore) return null; // Don't render if no store is selected

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, alignItems: "flex-start", display: "flex" }}
        >
          <StorefrontIcon sx={{ mr: 1 }} /> {activeStore.name}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};
