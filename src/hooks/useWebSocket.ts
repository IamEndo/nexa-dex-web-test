"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { WsEvent } from "@/types/api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9090/ws";
const RECONNECT_DELAY = 3000;
const HEARTBEAT_INTERVAL = 30000;

type EventHandler = (event: WsEvent) => void;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<EventHandler>>(new Set());
  const subsRef = useRef<Set<string>>(new Set());
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Resubscribe
      subsRef.current.forEach((channel) => {
        ws.send(JSON.stringify({ subscribe: channel }));
      });
      // Heartbeat
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ ping: true }));
        }
      }, HEARTBEAT_INTERVAL);
    };

    ws.onmessage = (e) => {
      try {
        const event: WsEvent = JSON.parse(e.data);
        handlersRef.current.forEach((handler) => handler(event));
      } catch {
        // Ignore non-JSON (pong, etc)
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const subscribe = useCallback((channel: string) => {
    subsRef.current.add(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ subscribe: channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    subsRef.current.delete(channel);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ unsubscribe: channel }));
    }
  }, []);

  const addHandler = useCallback((handler: EventHandler) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, subscribe, unsubscribe, addHandler };
}
