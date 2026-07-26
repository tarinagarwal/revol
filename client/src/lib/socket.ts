import { io, type Socket } from "socket.io-client";

/**
 * Socket.IO singleton — connected after auth (Epic 8 wires chat events).
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(BASE_URL, { autoConnect: false, transports: ["websocket"] });
  }
  return socket;
}
