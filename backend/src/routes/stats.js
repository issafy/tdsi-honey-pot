import { Router } from 'express';
import { getStats } from '../services/store.js';

const router = Router();

// GET /api/stats
router.get('/', async (req, res) => {
  res.json(await getStats());
});

export default router;
