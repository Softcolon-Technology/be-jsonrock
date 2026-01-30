import { Router } from 'express';
import multer from 'multer';
import { ShareController } from '../controllers/share.controller';

const router = Router();
const shareController = new ShareController();

// Multer config for memory storage (processing files in memory without saving to disk first)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Routes
// Note: Order matters. More specific routes first.

// /api/share endpoints (Metadata, Unlock, Update)
router.post('/share', (req, res) => shareController.createShare(req, res));
router.get('/share/:slug', (req, res) => shareController.getShareMetaData(req, res));
router.post('/share/:slug', (req, res) => shareController.unlockShare(req, res));
router.put('/share/:slug', (req, res) => shareController.updateShare(req, res));

// /api/upload
router.post('/upload', upload.single('file'), (req, res) => shareController.uploadShare(req, res));

// /api/:slug (Raw Fetch) - Must be last to avoid collision if possible, though /share prefix handles it.
router.get('/:slug', (req, res) => shareController.getRawShare(req, res));

export default router;
