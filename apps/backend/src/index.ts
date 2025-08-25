import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import storeRouter from './routes/store';
import productRouter from './routes/product';
import saleRouter from './routes/sale';
import shopRouter from './routes/shop';
import salesmanRouter from './routes/salesman';
import adminRouter from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// TODO: remove
// Debuingging env
console.log('Environment Variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL || 'DATABASE_URL not set',
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'POS Backend API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/stores', storeRouter);
app.use('/api/products', productRouter);
app.use('/api/sales', saleRouter);
app.use('/api/shops', shopRouter);
app.use("/api/salesmen", salesmanRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
