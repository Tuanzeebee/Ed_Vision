import { useEffect, useState } from "react";
import { io } from "socket.io-client";

/**
 * Hook to initialize shared WebSocket listeners for student/instructor stats.
 * Returns a numeric trigger that increments when a relevant event arrives.
 */
export default function useWebSocketStats(): number {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let studentSocket: ReturnType<typeof io> | null = null;
    let instructorSocket: ReturnType<typeof io> | null = null;

    const initializeWebSockets = () => {
      // Student socket
      try {
        studentSocket = io("http://localhost:3000/student-stats", {
          transports: ["websocket", "polling"],
        });
        studentSocket.on("connect", () => {
          // connected
        });
        studentSocket.on("studentOnlineStatsUpdated", () => {
          setTrigger((p) => p + 1);
        });
        studentSocket.on("disconnect", () => {
          // disconnected
        });
        studentSocket.on("connect_error", (_err) => {
          // ignore connection errors silently
        });
      } catch (e) {
        console.warn("Failed to initialize student WebSocket:", e);
      }

      // Instructor socket
      try {
        instructorSocket = io("http://localhost:3000/instructor-stats", {
          transports: ["websocket", "polling"],
        });
        instructorSocket.on("connect", () => {
          // connected
        });
        instructorSocket.on("instructorOnlineStatsUpdated", () => {
          setTrigger((p) => p + 1);
        });
        instructorSocket.on("disconnect", () => {
          // disconnected
        });
        instructorSocket.on("connect_error", (_err) => {
          // ignore connection errors silently
        });
      } catch (_e) {
        // fail silently
      }
    };

    initializeWebSockets();

    return () => {
      if (studentSocket) {
        try {
          studentSocket.disconnect();
        } catch (e) {
          /* ignore */
        }
      }
      if (instructorSocket) {
        try {
          instructorSocket.disconnect();
        } catch (e) {
          /* ignore */
        }
      }
    };
  }, []);

  return trigger;
}
