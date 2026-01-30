import { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler
 * This catches all requests that don't match any routes
 */
// eslint-disable-next-line no-unused-vars
const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
    });
};

export default notFoundHandler;
