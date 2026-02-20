/**
 * Phase 4: KPI Routes
 * API endpoints for KPI spatial analysis and recommendations
 */

import express from 'express';
import { KPIAnalyticsService } from '../services/kpiAnalyticsService';

const router = express.Router();
const kpiAnalytics = new KPIAnalyticsService();

/**
 * POST /api/kpi/spatial-context
 * Analyze spatial context for a KPI
 */
router.post('/spatial-context', async (req, res) => {
    try {
        const { kpi, warehouseState } = req.body;

        if (!kpi || !warehouseState) {
            return res.status(400).json({
                error: 'Missing required fields: kpi and warehouseState'
            });
        }

        const context = await kpiAnalytics.analyzeSpatialContext(
            kpi,
            warehouseState
        );

        res.json(context);
    } catch (error) {
        console.error('KPI spatial analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * GET /api/kpi/recommendations
 * Get improvement recommendations for a KPI
 */
router.get('/recommendations', async (req, res) => {
    try {
        const { kpiId } = req.query;

        if (!kpiId || typeof kpiId !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: kpiId'
            });
        }

        // Get warehouse state from request body or use mock data
        const warehouseState = req.body.warehouseState || {
            zones: [],
            entities: []
        };

        const recommendations = await kpiAnalytics.generateRecommendations(
            kpiId,
            warehouseState
        );

        res.json({ recommendations });
    } catch (error) {
        console.error('KPI recommendations error:', error);
        res.status(500).json({
            error: 'Recommendation generation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * POST /api/kpi/recommendations
 * Get improvement recommendations for a KPI (POST version with warehouse state)
 */
router.post('/recommendations', async (req, res) => {
    try {
        const { kpiId, warehouseState } = req.body;

        if (!kpiId) {
            return res.status(400).json({
                error: 'Missing required field: kpiId'
            });
        }

        const state = warehouseState || {
            zones: [],
            entities: []
        };

        const recommendations = await kpiAnalytics.generateRecommendations(
            kpiId,
            state
        );

        res.json({ recommendations });
    } catch (error) {
        console.error('KPI recommendations error:', error);
        res.status(500).json({
            error: 'Recommendation generation failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
