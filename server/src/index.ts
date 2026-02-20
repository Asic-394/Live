import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agentRoutes from './routes/agent';
import kpiRoutes from './routes/kpi';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

// Middleware
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/agent', agentRoutes);
app.use('/api/kpi', kpiRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'warehouse-live-backend',
        version: '1.0.0'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Server Error]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Warehouse Live Backend Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
    console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not set (mock mode)'}`);
    console.log('='.repeat(60));
    console.log('📋 Available endpoints:');
    console.log('  GET  /api/health');
    console.log('  GET  /api/agent/health');
    console.log('  POST /api/agent/query');
    console.log('  POST /api/agent/briefing');
    console.log('  POST /api/agent/suggestions');
    console.log('  POST /api/kpi/spatial-context');
    console.log('  GET  /api/kpi/recommendations');
    console.log('  POST /api/kpi/recommendations');
    console.log('='.repeat(60));
});
