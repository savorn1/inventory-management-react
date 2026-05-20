import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface PaymentEvent {
  paymentId: number;
  paymentNo: string;
  status: string;
  amount: number;
  paidAt: string | null;
}

type Handler = (event: PaymentEvent) => void;

export function usePaymentSocket(onEvent: Handler) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef<Handler>(onEvent);

  useEffect(() => {
    handlerRef.current = onEvent;
  });

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("/ws"),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe("/topic/payments", (msg) => {
          try {
            const event: PaymentEvent = JSON.parse(msg.body);
            handlerRef.current(event);
          } catch {
            /* ignore malformed messages */
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();

    return () => {
      client.deactivate();
    };
  }, []);

  return { connected };
}
