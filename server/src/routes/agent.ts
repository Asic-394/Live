import { Router, Request, Response } from 'express';
import { OpsAgent } from '../agents/OpsAgent';
import * as ruleEngine from '../agents/ruleEngine';
import { alertDetectionService } from '../services/alertDetectionService';
import { recommendationEngine } from '../services/recommendationEngine';
import { gestationManager } from '../services/gestationManager';
import { explainabilityService } from '../services/explainabilityService';
import { outcomeTracker } from '../services/outcomeTracker';
import { autonomyFramework } from '../services/autonomyFramework';

const router = Router();
const opsAgent = new OpsAgent();

// POST /api/agent/query - Main query endpoint
router.post('/query', async (req: Request, res: Response) => {
    try {
        const { message, context } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required and must be a string' });
        }

        console.log('[Agent Route] Query received:', message);

        // Step 1: Try rule engine first
        const ruleMatch = ruleEngine.matchRule(message, context);

        if (ruleMatch.matched && ruleMatch.confidence && ruleMatch.confidence > 0.7) {
            console.log('[Agent Route] Rule matched:', ruleMatch.ruleId, 'confidence:', ruleMatch.confidence);

            return res.json({
                message: ruleMatch.response,
                actions: ruleMatch.actions || [],
                suggestions: [],
                source: 'rule',
                ruleId: ruleMatch.ruleId,
                confidence: ruleMatch.confidence,
                timestamp: new Date().toISOString()
            });
        }

        // Step 2: Fallback to LLM via OpsAgent
        console.log('[Agent Route] No high-confidence rule match, using LLM');
        const result = await opsAgent.processIntent(message, context || {});

        return res.json({
            message: result.message,
            actions: result.actions,
            suggestions: [],
            source: result.source,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Agent Route] Error processing query:', error);
        return res.status(500).json({
            error: 'Failed to process query',
            message: 'I encountered an error processing your request. Please try again.',
            actions: [],
            suggestions: []
        });
    }
});

// POST /api/agent/briefing - Get shift briefing
router.post('/briefing', async (req: Request, res: Response) => {
    try {
        const { context } = req.body;

        console.log('[Agent Route] Briefing requested');
        const briefing = await opsAgent.getBriefing(context || {});

        return res.json({
            message: briefing,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Agent Route] Error generating briefing:', error);
        return res.status(500).json({
            error: 'Failed to generate briefing',
            message: 'Could not generate shift briefing at this time.'
        });
    }
});

// POST /api/agent/suggestions - Get contextual suggestions
router.post('/suggestions', async (req: Request, res: Response) => {
    try {
        const { context } = req.body;

        console.log('[Agent Route] Suggestions requested');
        const suggestions = await opsAgent.getSuggestions(context || {});

        return res.json({
            suggestions,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Agent Route] Error generating suggestions:', error);
        return res.status(500).json({
            error: 'Failed to generate suggestions',
            suggestions: []
        });
    }
});

// GET /api/agent/health - Health check
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'agent',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// Phase 3: Alert Management Endpoints
// ============================================================================

// GET /api/agent/alerts - Get active alerts
router.get('/alerts', async (req: Request, res: Response) => {
    try {
        const { severity, category, minConfidence } = req.query;

        const filters: any = {};
        if (severity) filters.severity = Array.isArray(severity) ? severity : [severity];
        if (category) filters.category = Array.isArray(category) ? category : [category];
        if (minConfidence) filters.minConfidence = parseFloat(minConfidence as string);

        const alerts = await alertDetectionService.getActiveAlerts(filters);

        return res.json({
            alerts,
            count: alerts.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error fetching alerts:', error);
        return res.status(500).json({
            error: 'Failed to fetch alerts',
            alerts: []
        });
    }
});

// PATCH /api/agent/alerts/:id/status - Update alert status
router.patch('/alerts/:id/status', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'acknowledged', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await alertDetectionService.updateAlertStatus(id, status);

        return res.json({
            success: true,
            message: `Alert ${id} status updated to ${status}`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error updating alert status:', error);
        return res.status(500).json({
            error: 'Failed to update alert status'
        });
    }
});

// ============================================================================
// Phase 3: Recommendation Endpoints
// ============================================================================

// POST /api/agent/recommendations/:id/tune - Tune recommendation
router.post('/recommendations/:id/tune', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { tuningInput, context } = req.body;

        if (!tuningInput) {
            return res.status(400).json({ error: 'Tuning input is required' });
        }

        const tunedRecommendation = await recommendationEngine.tuneRecommendation(
            id,
            tuningInput,
            context || {}
        );

        return res.json({
            recommendation: tunedRecommendation,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error tuning recommendation:', error);
        return res.status(500).json({
            error: 'Failed to tune recommendation',
            message: error.message
        });
    }
});

// POST /api/agent/recommendations/:id/execute - Execute recommendation
router.post('/recommendations/:id/execute', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { context } = req.body;

        const recommendation = recommendationEngine.getRecommendationById(id);
        if (!recommendation) {
            return res.status(404).json({ error: 'Recommendation not found' });
        }

        // Classify the action
        const classifiedAction = autonomyFramework.classifyAction(recommendation, context || {});

        // Queue for gestation if automated or semi-automated
        let gestationItem = null;
        if (classifiedAction.tier === 'automated' || classifiedAction.tier === 'semi-automated') {
            gestationItem = gestationManager.queueAction(
                classifiedAction,
                classifiedAction.gestationPeriod!
            );
        }

        // Start outcome tracking
        const outcome = outcomeTracker.startTracking(recommendation, classifiedAction);

        return res.json({
            success: true,
            classifiedAction,
            gestationItem,
            outcome,
            message: `Recommendation queued for execution (${classifiedAction.tier})`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error executing recommendation:', error);
        return res.status(500).json({
            error: 'Failed to execute recommendation',
            message: error.message
        });
    }
});

// ============================================================================
// Phase 3: Gestation Endpoints
// ============================================================================

// GET /api/agent/gestation/pending - Get pending gestation items
router.get('/gestation/pending', async (req: Request, res: Response) => {
    try {
        const pendingItems = gestationManager.getPendingItems();

        return res.json({
            items: pendingItems,
            count: pendingItems.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error fetching pending gestations:', error);
        return res.status(500).json({
            error: 'Failed to fetch pending gestations',
            items: []
        });
    }
});

// POST /api/agent/gestation/:id/object - Object to a gestation action
router.post('/gestation/:id/object', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ error: 'Objection reason is required' });
        }

        gestationManager.objectToAction(id, reason);

        return res.json({
            success: true,
            message: `Objection recorded for action ${id}`,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error objecting to gestation:', error);
        return res.status(500).json({
            error: 'Failed to object to gestation',
            message: error.message
        });
    }
});

// ============================================================================
// Phase 3: Explainability Endpoints
// ============================================================================

// GET /api/agent/explainability/:alertId - Get explainability for an alert
router.get('/explainability/:alertId', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;

        const alert = await alertDetectionService.getAlertById(alertId);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const explainability = explainabilityService.buildExplainability(
            alert,
            {} // context
        );

        return res.json({
            explainability,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error fetching explainability:', error);
        return res.status(500).json({
            error: 'Failed to fetch explainability'
        });
    }
});

// ============================================================================
// Phase 3: Outcome Tracking Endpoints
// ============================================================================

// GET /api/agent/outcomes - Get outcomes
router.get('/outcomes', async (req: Request, res: Response) => {
    try {
        const { status, minAccuracy, startTime, endTime } = req.query;

        const filters: any = {};
        if (status) filters.status = Array.isArray(status) ? status : [status];
        if (minAccuracy) filters.minAccuracy = parseFloat(minAccuracy as string);
        if (startTime && endTime) {
            filters.timeRange = [parseInt(startTime as string), parseInt(endTime as string)];
        }

        const outcomes = outcomeTracker.getOutcomes(filters);

        return res.json({
            outcomes,
            count: outcomes.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error fetching outcomes:', error);
        return res.status(500).json({
            error: 'Failed to fetch outcomes',
            outcomes: []
        });
    }
});

// GET /api/agent/outcomes/stats - Get outcome statistics
router.get('/outcomes/stats', async (req: Request, res: Response) => {
    try {
        const { category, startTime, endTime } = req.query;

        const filters: any = {};
        if (category) filters.category = category as string;
        if (startTime && endTime) {
            filters.timeRange = [parseInt(startTime as string), parseInt(endTime as string)];
        }

        const stats = outcomeTracker.getOutcomeStats(filters);

        return res.json({
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('[Agent Route] Error fetching outcome stats:', error);
        return res.status(500).json({
            error: 'Failed to fetch outcome stats'
        });
    }
});

export default router;
