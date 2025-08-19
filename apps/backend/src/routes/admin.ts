import { Router } from "express";
const router = Router();

router.post("/unlock", (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin password" });
  }
  res.json({ success: true });
});

export default router;
