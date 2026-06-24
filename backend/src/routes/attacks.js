import { Router } from 'express';
import { getAttacks } from '../services/store.js';

const router = Router();

// GET /api/attacks?limit=50
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const attacks = await getAttacks(limit);
  res.json({ data: attacks, total: attacks.length });
});

export default router;
