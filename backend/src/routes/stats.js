import { Router } from 'express';
import { getStats } from '../services/store.js';

const router = Router();

// GET /api/stats
router.get('/', (req, res) => {
  res.json(getStats());
});

export default router;
