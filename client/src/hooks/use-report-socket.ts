import { useEffect } from "react";
import { useReportsStore } from "../store/reports.store";
import { useSocket } from "../hooks/use-socket";

/**
 * Hook to listen for real-time report updates via Socket.io
 * - New reports created
 * - Report status changes (resolved/dismissed)
 */
export const useReportSocket = () => {
  const { socket } = useSocket();
  const { addReport, updateReport } = useReportsStore();

  useEffect(() => {
    if (!socket) return;

    // Listen for new reports
    const handleReportCreated = (data: any) => {
      const { report } = data;
      addReport(report);

      // Show toast notification
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("report:created", {
            detail: { report },
          })
        );
      }
    };

    // Listen for report status changes
    const handleReportStatusChanged = (data: any) => {
      const { reportId, status, report } = data;
      updateReport(reportId, {
        status,
        ...report,
      });

      // Show toast notification
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("report:updated", {
            detail: { reportId, status },
          })
        );
      }
    };

    socket.on("report:created", handleReportCreated);
    socket.on("report:status-changed", handleReportStatusChanged);

    return () => {
      socket.off("report:created", handleReportCreated);
      socket.off("report:status-changed", handleReportStatusChanged);
    };
  }, [socket, addReport, updateReport]);
};

/**
 * Hook to join/leave admin report room
 * Should be called when admin views the reports page
 */
export const useAdminReportRoom = (isAdmin: boolean) => {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket || !isAdmin) return;

    // Emit event to join admin reports room
    socket.emit("admin:join-reports-room");

    return () => {
      // Emit event to leave admin reports room
      socket.emit("admin:leave-reports-room");
    };
  }, [socket, isAdmin]);
};
