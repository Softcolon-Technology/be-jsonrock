import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './db/conn';
import shareRoutes from './routes/share.routes';
import morgan from 'morgan';
import logger from './config/logger';
import globalErrorHandler from './middleware/errorLogger';
import notFoundHandler from './middleware/notFound';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', shareRoutes);

connectDB();

const io = new Server(httpServer, {
    path: '/api/socket/io',
    addTrailingSlash: false,
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    // console.log("New client connected", socket.id);

    socket.on('join-room', (slug: string) => {
        socket.join(slug);
        // console.log(`Client ${socket.id} joined room ${slug}`);
    });

    socket.on('code-change', (data: { slug: string; newCode: string }) => {
        // Broadcast to everyone ELSE in the room
        socket.to(data.slug).emit('code-change', data.newCode);
    });

    socket.on('leave-room', (slug: string) => {
        socket.leave(slug);
        // console.log(`Client ${socket.id} left room ${slug}`);
    });

    socket.on('disconnect', () => {
        // console.log("Client disconnected", socket.id);
    });
});

app.get('/', (req: Request, res: Response) => {
    res.send('JSON Cracker Backend is running!');
});

// 404 handler 
app.use(notFoundHandler);

// Global error handler 
app.use(globalErrorHandler);

process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', {
        reason,
    });
});

httpServer.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});