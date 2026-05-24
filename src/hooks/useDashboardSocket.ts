import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

/**
 * Subscribes to order and payment WebSocket topics so the dashboard
 * refreshes the moment any relevant event arrives on the backend.
 *
 * When the socket is disconnected it falls back to polling every
 * `pollInterval` ms (default 30 s).
 */
export function useDashboardSocket(
  onRefresh: () => void,
  pollInterval = 30_000,
) {
  const [connected, setConnected] = useState(false);
  const onRefreshRef = useRef(onRefresh);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedRef = useRef(false);

  // Always call the latest version of onRefresh without re-running effects
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  });

  // ── polling fallback ────────────────────────────────────────────────────────
  // Runs only while the socket is disconnected; cleared as soon as we connect.
  function startPolling() {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (!connectedRef.current) onRefreshRef.current();
    }, pollInterval);
  }

  function stopPolling() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── STOMP client ────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      reconnectDelay: 5_000,
      onConnect: () => {
        connectedRef.current = true;
        setConnected(true);
        stopPolling();

        // Refresh once immediately on (re)connect to catch anything missed
        onRefreshRef.current();

        // Orders: status changes affect orderStatusSummary + totals
        client.subscribe("/topic/orders", () => {
          onRefreshRef.current();
        });

        // Payments: new/updated payments affect paymentChart + totalOrderAmount
        client.subscribe("/topic/payments", () => {
          onRefreshRef.current();
        });
      },
      onDisconnect: () => {
        connectedRef.current = false;
        setConnected(false);
        startPolling();
      },
      onStompError: () => {
        connectedRef.current = false;
        setConnected(false);
        startPolling();
      },
    });

    // Start polling right away; it will be cancelled once the socket connects
    startPolling();
    client.activate();

    return () => {
      stopPolling();
      client.deactivate();
    };
    // pollInterval is intentionally excluded — changing it at runtime is not
    // a use-case we need to support, and would require restarting the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected };
}
