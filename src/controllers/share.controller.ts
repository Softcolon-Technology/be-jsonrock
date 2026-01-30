import { Request, Response } from 'express';
import { ShareService } from '../services/share.service';
import { JsonShareMode } from '../models/share.model';

const shareService = new ShareService();

// Hack to make TS happy if @types/multer isn't picked up globally immediately
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class ShareController {

    async createShare(req: Request, res: Response): Promise<void> {
        try {
            let { json, mode, isPrivate, accessType, password, type, slug } = req.body;

            if (type === 'text') {
                json = json || "";
            }

            if (typeof json !== "string" || (!json.trim() && type !== 'text')) {
                res.status(400).json({ error: "Invalid payload" });
                return;
            }

            // Default mode to visualize if not provided
            let effectiveMode = mode;
            if (type === 'text' && !effectiveMode) {
                effectiveMode = "visualize";
            }

            if (!effectiveMode || !["visualize", "tree", "formatter"].includes(effectiveMode)) {
                res.status(400).json({ error: "Invalid mode" });
                return;
            }

            const isPrivateFlag = Boolean(isPrivate);

            if (isPrivateFlag && (!password || password.length < 4)) {
                res.status(400).json({ error: "Password must be at least 4 characters for private links" });
                return;
            }

            const record = await shareService.createShareLink({
                json,
                mode: effectiveMode,
                isPrivate: isPrivateFlag,
                accessType,
                password,
                type: type || 'json',
                slug
            });

            res.json({
                slug: record.slug,
                mode: record.mode,
                type: record.type,
                isPrivate: record.isPrivate,
                accessType: record.accessType,
            });

        } catch (error) {
            console.error("Error creating share link", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getRawShare(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            const password = req.query.password as string | undefined;

            if (!slug) {
                res.status(400).json({ error: "Slug is required" });
                return;
            }

            const record = await shareService.getShareLink(slug as string);

            if (!record) {
                res.status(404).json({ error: "Not found" });
                return;
            }

            // check password if private
            if (record.isPrivate) {
                if (!password) {
                    // If password missing in query, deny raw access
                    res.status(401).json({ error: "Password is required" });
                    return;
                }

                const isValid = shareService.verifyPassword(record, password);
                if (!isValid) {
                    res.status(401).json({ error: "Password is incorrect" });
                    return;
                }
            }

            res.json(record.type === 'json' ? JSON.parse(record.json) : record.json);

        } catch (error) {
            console.error("API Error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async getShareMetaData(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            if (!slug) {
                res.status(400).json({ error: "Slug is required" });
                return;
            }

            const record = await shareService.getShareLink(slug as string);

            if (!record) {
                res.status(404).json({ error: "Not found" });
                return;
            }

            if (record.isPrivate) {
                res.json({
                    data: null,
                    type: record.type,
                    slug: record.slug,
                    isPrivate: true,
                    accessType: record.accessType,
                    mode: record.mode
                });
                return;
            }

            res.json({
                type: record.type,
                data: record.type === 'json' ? JSON.parse(record.json) : record.json,
                slug: record.slug,
                isPrivate: record.isPrivate,
                accessType: record.accessType,
                mode: record.mode
            });

        } catch (error) {
            console.error("API Error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async unlockShare(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            const { password } = req.body;

            if (!password) {
                res.status(400).json({ error: "Password is required" });
                return;
            }

            const record = await shareService.getShareLink(slug as string);
            if (!record) {
                res.status(404).json({ error: "Not found" });
                return;
            }

            const isValid = shareService.verifyPassword(record, password);
            if (!isValid) {
                res.status(401).json({ error: "Invalid password" });
                return;
            }

            res.json({
                type: record.type,
                data: record.type === 'json' ? JSON.parse(record.json) : record.json,
                slug: record.slug,
                isPrivate: record.isPrivate,
                accessType: record.accessType,
                mode: record.mode
            });

        } catch (error) {
            console.error("Unknown error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async updateShare(req: Request, res: Response): Promise<void> {
        try {
            const { slug } = req.params;
            let { json, mode, isPrivate, accessType, password, type } = req.body;

            if (type === 'text') {
                json = json || "";
            }

            if (typeof json !== "string" || (!json.trim() && type !== 'text')) {
                res.status(400).json({ error: "Invalid payload" });
                return;
            }

            const effectiveMode = (type === 'text' && !mode) ? 'visualize' : mode;

            if (!effectiveMode || !["visualize", "tree", "formatter"].includes(effectiveMode)) {
                res.status(400).json({ error: "Invalid mode" });
                return;
            }

            const isPrivateFlag = Boolean(isPrivate);
            if (isPrivateFlag && (!password || password.length < 4)) {
                res.status(400).json({ error: "Password must be at least 4 characters for private links" });
                return;
            }

            const existing = await shareService.getShareLink(slug as string);
            if (existing) {
                if (existing.isPrivate && !isPrivateFlag) {
                    res.status(400).json({ error: "Cannot change a private link to public" });
                    return;
                }

                await shareService.updateShareLink(slug as string, {
                    json,
                    mode: effectiveMode,
                    isPrivate: isPrivateFlag,
                    accessType,
                    password,
                    type: type || 'json'
                });
                res.json({ success: true, slug });
                return;
            }

            // Upsert / Create if not exists (fallback)
            await shareService.createShareLink({
                slug: slug as string,
                json,
                mode: effectiveMode,
                isPrivate: isPrivateFlag,
                accessType: accessType || 'editor',
                password,
                type: type || 'json'
            });
            res.json({ success: true, slug, created: true });

        } catch (error) {
            console.error("API Error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async uploadShare(req: Request, res: Response): Promise<void> {
        try {
            const file = (req as MulterRequest).file;

            if (!file) {
                res.status(400).json({ error: "No file provided" });
                return;
            }

            // size check handled by multer limits, but safe double check
            if (file.size > 2 * 1024 * 1024) {
                res.status(413).json({ error: "File size exceeds 2MB limit" });
                return;
            }

            const text = file.buffer.toString('utf-8');

            // Validate JSON
            try {
                JSON.parse(text);
            } catch {
                res.status(400).json({ error: "Invalid JSON file" });
                return;
            }

            const record = await shareService.createShareLink({
                json: text,
                mode: 'visualize', // Default or could be inferred
                isPrivate: false,
                accessType: 'editor',
                type: 'json'
            });

            res.json({ slug: record.slug });

        } catch (error) {
            console.error("Upload API Error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
