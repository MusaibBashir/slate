import * as Y from 'yjs';
import { supabase } from './supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SupabaseProviderOptions {
    projectId: string;
    userId: string;
    userName: string;
    userColor: string;
}

/**
 * A Yjs provider that syncs document state via Supabase Realtime
 */
export class SupabaseProvider {
    private doc: Y.Doc;
    private channel: RealtimeChannel | null = null;
    private projectId: string;
    private userId: string;
    private userName: string;
    private userColor: string;
    private awareness: Map<string, any> = new Map();
    private awarenessListeners: Set<(states: Map<string, any>) => void> = new Set();
    private isConnected = false;
    private pendingUpdates: Uint8Array[] = [];

    constructor(doc: Y.Doc, options: SupabaseProviderOptions) {
        this.doc = doc;
        this.projectId = options.projectId;
        this.userId = options.userId;
        this.userName = options.userName;
        this.userColor = options.userColor;

        // Listen for local document changes
        this.doc.on('update', this.handleLocalUpdate.bind(this));

        // Connect to Supabase Realtime
        this.connect();
    }

    private async connect() {
        const channelName = `project:${this.projectId}`;

        this.channel = supabase.channel(channelName, {
            config: {
                broadcast: { self: false },
                presence: { key: this.userId },
            },
        });

        // Listen for document updates from other clients
        this.channel.on('broadcast', { event: 'doc-update' }, (payload) => {
            const update = new Uint8Array(payload.payload.update);
            Y.applyUpdate(this.doc, update, 'remote');
        });

        // Listen for awareness updates (cursor positions, user presence)
        this.channel.on('broadcast', { event: 'awareness' }, (payload) => {
            if (payload.payload.userId !== this.userId) {
                this.awareness.set(payload.payload.userId, payload.payload.state);
                this.notifyAwarenessListeners();
            }
        });

        // Handle presence for online users
        this.channel.on('presence', { event: 'sync' }, () => {
            const state = this.channel?.presenceState() || {};
            // Update awareness with current presence
            Object.entries(state).forEach(([key, value]) => {
                if (key !== this.userId && Array.isArray(value) && value[0]) {
                    this.awareness.set(key, value[0]);
                }
            });
            this.notifyAwarenessListeners();
        });

        this.channel.on('presence', { event: 'leave' }, ({ key }) => {
            this.awareness.delete(key);
            this.notifyAwarenessListeners();
        });

        // Subscribe to the channel
        await this.channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                this.isConnected = true;

                // Track presence
                await this.channel?.track({
                    user_id: this.userId,
                    user_name: this.userName,
                    user_color: this.userColor,
                    online_at: new Date().toISOString(),
                });

                // Send any pending updates
                for (const update of this.pendingUpdates) {
                    this.broadcastUpdate(update);
                }
                this.pendingUpdates = [];

                // Request sync from other clients
                this.channel?.send({
                    type: 'broadcast',
                    event: 'sync-request',
                    payload: { userId: this.userId },
                });
            }
        });

        // Listen for sync requests and respond with full state
        this.channel?.on('broadcast', { event: 'sync-request' }, (payload) => {
            if (payload.payload.userId !== this.userId) {
                // Send full document state to the requesting client
                const state = Y.encodeStateAsUpdate(this.doc);
                this.channel?.send({
                    type: 'broadcast',
                    event: 'sync-response',
                    payload: {
                        userId: this.userId,
                        targetUserId: payload.payload.userId,
                        state: Array.from(state),
                    },
                });
            }
        });

        // Apply sync responses
        this.channel?.on('broadcast', { event: 'sync-response' }, (payload) => {
            if (payload.payload.targetUserId === this.userId) {
                const state = new Uint8Array(payload.payload.state);
                Y.applyUpdate(this.doc, state, 'remote');
            }
        });
    }

    private handleLocalUpdate(update: Uint8Array, origin: any) {
        // Don't broadcast updates that came from remote
        if (origin === 'remote') return;

        if (this.isConnected) {
            this.broadcastUpdate(update);
        } else {
            this.pendingUpdates.push(update);
        }
    }

    private broadcastUpdate(update: Uint8Array) {
        this.channel?.send({
            type: 'broadcast',
            event: 'doc-update',
            payload: {
                userId: this.userId,
                update: Array.from(update),
            },
        });
    }

    /**
     * Update local awareness state (cursor position, selection, etc.)
     */
    setAwarenessState(state: any) {
        const fullState = {
            userId: this.userId,
            userName: this.userName,
            userColor: this.userColor,
            ...state,
        };

        this.awareness.set(this.userId, fullState);

        this.channel?.send({
            type: 'broadcast',
            event: 'awareness',
            payload: {
                userId: this.userId,
                state: fullState,
            },
        });
    }

    /**
     * Subscribe to awareness state changes
     */
    onAwarenessChange(callback: (states: Map<string, any>) => void) {
        this.awarenessListeners.add(callback);
        return () => this.awarenessListeners.delete(callback);
    }

    private notifyAwarenessListeners() {
        this.awarenessListeners.forEach((callback) => callback(this.awareness));
    }

    /**
     * Get all awareness states
     */
    getAwarenessStates(): Map<string, any> {
        return this.awareness;
    }

    /**
     * Disconnect from Supabase Realtime
     */
    destroy() {
        this.doc.off('update', this.handleLocalUpdate.bind(this));

        if (this.channel) {
            this.channel.untrack();
            supabase.removeChannel(this.channel);
        }

        this.isConnected = false;
        this.awareness.clear();
        this.awarenessListeners.clear();
    }
}

// Generate a random color for user cursor
export function generateUserColor(): string {
    const colors = [
        '#f87171', // red
        '#fb923c', // orange
        '#fbbf24', // amber
        '#a3e635', // lime
        '#34d399', // emerald
        '#22d3ee', // cyan
        '#60a5fa', // blue
        '#a78bfa', // violet
        '#f472b6', // pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export default SupabaseProvider;
