/**
 * Gestation Manager
 * Manages auto-execute countdown with objection mechanism
 */

import {
    GestationItem,
    ClassifiedAction,
    GestationStatus,
    ExecutionResult,
} from '../types/phase3';

class GestationManager {
    private queue: Map<string, GestationItem> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private executionCallbacks: Map<
        string,
        (action: ClassifiedAction) => Promise<ExecutionResult>
    > = new Map();

    /**
     * Queue an action for gestation
     */
    queueAction(
        action: ClassifiedAction,
        gestationPeriod: number
    ): GestationItem {
        const now = Date.now();
        const item: GestationItem = {
            id: action.id,
            action,
            gestationPeriod,
            queuedAt: now,
            executeAt: now + gestationPeriod,
            status: 'pending',
        };

        this.queue.set(item.id, item);

        // Start countdown timer
        const timer = setTimeout(() => {
            this.executeAction(item.id);
        }, gestationPeriod);

        this.timers.set(item.id, timer);

        console.log(
            `[GestationManager] Queued action ${item.id} for execution in ${gestationPeriod}ms`
        );

        return item;
    }

    /**
     * Object to a pending action (cancel execution)
     */
    objectToAction(itemId: string, reason: string): void {
        const item = this.queue.get(itemId);
        if (!item) {
            throw new Error(`Gestation item ${itemId} not found`);
        }

        if (item.status !== 'pending') {
            throw new Error(
                `Cannot object to action ${itemId} with status ${item.status}`
            );
        }

        // Cancel timer
        const timer = this.timers.get(itemId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(itemId);
        }

        // Update status
        item.status = 'objected';
        item.objectionReason = reason;

        console.log(
            `[GestationManager] Action ${itemId} objected: ${reason}`
        );
    }

    /**
     * Get all pending gestation items
     */
    getPendingItems(): GestationItem[] {
        return Array.from(this.queue.values()).filter(
            (item) => item.status === 'pending'
        );
    }

    /**
     * Get gestation item by ID
     */
    getItemById(itemId: string): GestationItem | undefined {
        return this.queue.get(itemId);
    }

    /**
     * Execute action after gestation period
     */
    private async executeAction(itemId: string): Promise<void> {
        const item = this.queue.get(itemId);
        if (!item) {
            console.error(`[GestationManager] Item ${itemId} not found`);
            return;
        }

        // Check if objected
        if (item.status === 'objected') {
            console.log(
                `[GestationManager] Action ${itemId} was objected, skipping execution`
            );
            return;
        }

        // Verify action is still valid
        if (!this.isActionStillValid(item)) {
            item.status = 'expired';
            console.log(
                `[GestationManager] Action ${itemId} is no longer valid, marking as expired`
            );
            return;
        }

        // Update status to executing
        item.status = 'executing';
        console.log(`[GestationManager] Executing action ${itemId}`);

        try {
            // Execute the action
            const result = await this.performExecution(item.action);
            item.executionResult = result;
            item.status = 'completed';
            console.log(
                `[GestationManager] Action ${itemId} completed successfully`
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            item.executionResult = {
                success: false,
                message: 'Execution failed',
                error: errorMessage,
            };
            item.status = 'completed'; // Mark as completed even if failed
            console.error(
                `[GestationManager] Action ${itemId} failed:`,
                errorMessage
            );
        }

        // Clean up timer
        this.timers.delete(itemId);

        // Schedule cleanup after 1 hour
        setTimeout(() => {
            this.queue.delete(itemId);
            console.log(`[GestationManager] Cleaned up action ${itemId}`);
        }, 60 * 60 * 1000);
    }

    /**
     * Check if action is still valid
     */
    private isActionStillValid(item: GestationItem): boolean {
        // Check if action has expired
        if (item.action.recommendation.expiresAt) {
            if (Date.now() > item.action.recommendation.expiresAt) {
                return false;
            }
        }

        // Additional validation could be added here:
        // - Check if context has changed significantly
        // - Check if conflicting actions are in progress
        // - Check if required resources are available

        return true;
    }

    /**
     * Perform the actual execution of an action
     */
    private async performExecution(
        action: ClassifiedAction
    ): Promise<ExecutionResult> {
        // Check if a custom execution callback is registered
        const callback = this.executionCallbacks.get(action.id);
        if (callback) {
            return await callback(action);
        }

        // Default execution logic based on action type
        const recommendation = action.recommendation;
        const results: string[] = [];

        for (const recAction of recommendation.actions) {
            switch (recAction.type) {
                case 'camera':
                    results.push(
                        `Camera focused on ${recAction.target} with parameters: ${JSON.stringify(
                            recAction.parameters
                        )}`
                    );
                    break;

                case 'notify':
                    results.push(
                        `Notification sent to ${recAction.target}: ${recAction.parameters.message}`
                    );
                    break;

                case 'dispatch':
                    results.push(
                        `Dispatched ${recAction.target} to ${recAction.parameters.destination}`
                    );
                    break;

                case 'reallocate':
                    results.push(
                        `Reallocated resources in ${recAction.target} with action: ${recAction.parameters.action}`
                    );
                    break;

                default:
                    results.push(
                        `Executed ${recAction.type} on ${recAction.target}`
                    );
            }
        }

        return {
            success: true,
            message: `Executed ${recommendation.title}`,
            data: {
                results,
                timestamp: Date.now(),
            },
        };
    }

    /**
     * Register a custom execution callback for an action
     */
    registerExecutionCallback(
        actionId: string,
        callback: (action: ClassifiedAction) => Promise<ExecutionResult>
    ): void {
        this.executionCallbacks.set(actionId, callback);
    }

    /**
     * Clean up expired items
     */
    cleanupExpired(): void {
        const now = Date.now();
        for (const [id, item] of this.queue.entries()) {
            if (
                item.status === 'completed' ||
                item.status === 'expired' ||
                item.status === 'objected'
            ) {
                // Remove items that have been completed/expired for more than 1 hour
                if (now - item.queuedAt > 60 * 60 * 1000) {
                    this.queue.delete(id);
                    this.timers.delete(id);
                    this.executionCallbacks.delete(id);
                }
            }
        }
    }

    /**
     * Get all gestation items (for debugging/monitoring)
     */
    getAllItems(): GestationItem[] {
        return Array.from(this.queue.values());
    }

    /**
     * Clear all gestation items (for testing)
     */
    clearAll(): void {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }

        this.queue.clear();
        this.timers.clear();
        this.executionCallbacks.clear();
    }
}

// Export singleton instance
export const gestationManager = new GestationManager();

// Run cleanup every 5 minutes
setInterval(() => {
    gestationManager.cleanupExpired();
}, 5 * 60 * 1000);
