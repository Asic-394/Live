import React, { useEffect, useRef } from 'react';
import { CommandBar } from './CommandBar';
import { useAgentStore } from '../../state/agentStore';
import { useStore } from '../../state/store';
import { CameraCommandService } from '../../services/CameraCommandService';
import type { AgentContext } from '../../types/agent';
import { useThree } from '@react-three/fiber';

interface CommandBarContainerProps {
    controlsRef: React.RefObject<any>;
}

export const CommandBarContainer: React.FC<CommandBarContainerProps> = ({ controlsRef }) => {
    // Agent store
    const {
        agentState,
        isProcessing,
        lastResponse,
        suggestions,
        sendMessage,
        loadSuggestions,
        isCommandBarVisible
    } = useAgentStore();

    // Warehouse store
    const {
        entities,
        warehouseLayout,
        kpis,
        focusOnZone
    } = useStore();

    // Get camera from Three.js context (we'll need to pass this differently)
    const cameraRef = useRef<any>(null);

    // Load initial suggestions
    useEffect(() => {
        const context = buildContext();
        loadSuggestions(context);
    }, [entities, warehouseLayout, loadSuggestions]);

    // Execute actions when response arrives
    useEffect(() => {
        if (lastResponse && lastResponse.actions.length > 0) {
            console.log('[CommandBarContainer] Executing actions from response');

            // Flatten warehouse layout to array for camera service
            const zones = warehouseLayout
                ? [
                    ...(warehouseLayout.zones || []),
                    ...(warehouseLayout.aisles || []),
                    ...(warehouseLayout.racks || []),
                    ...(warehouseLayout.docks || [])
                ]
                : null;

            CameraCommandService.executeActions(
                lastResponse.actions,
                { focusOnZone },
                controlsRef,
                cameraRef.current,
                zones,
                entities
            );
        }
    }, [lastResponse, controlsRef, warehouseLayout, entities, focusOnZone]);

    const buildContext = (): AgentContext => {
        // Convert WarehouseLayout object to flat array of elements
        const zones = warehouseLayout
            ? [
                ...(warehouseLayout.zones || []),
                ...(warehouseLayout.aisles || []),
                ...(warehouseLayout.racks || []),
                ...(warehouseLayout.docks || [])
            ]
            : [];

        return {
            entities: entities || [],
            zones,
            metrics: kpis || {},
            alerts: [], // TODO: Add alerts when available
            timestamp: new Date().toISOString()
        };
    };

    const handleSubmit = async (message: string) => {
        const context = buildContext();
        await sendMessage(message, context);
    };

    const handleSuggestionClick = async (text: string) => {
        const context = buildContext();
        await sendMessage(text, context);
    };

    if (!isCommandBarVisible) {
        return null;
    }

    return (
        <CommandBar
            agentState={agentState}
            suggestions={suggestions}
            lastResponse={lastResponse?.message || null}
            isProcessing={isProcessing}
            onSubmit={handleSubmit}
            onSuggestionClick={handleSuggestionClick}
        />
    );
};

// Wrapper that can access Three.js camera
export const CommandBarWithCamera: React.FC<CommandBarContainerProps> = (props) => {
    const { camera } = useThree();
    const containerRef = useRef<any>(null);

    // Store camera reference
    useEffect(() => {
        if (camera && containerRef.current) {
            containerRef.current.camera = camera;
        }
    }, [camera]);

    return <CommandBarContainer {...props} />;
};

export default CommandBarContainer;
