import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@/lib/axios-client";
import { X, AlertCircle, MessageSquare, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { formatChatTime } from "@/lib/helper";
import { useReportSocket, useAdminReportRoom } from "@/hooks/use-report-socket";
import { useReportsStore } from "@/store/reports.store";
import { useAuth } from "@/hooks/use-auth";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reports, setReports } = useReportsStore();
  const [loading, setLoading] = useState(true);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Socket hooks
  useReportSocket();
  useAdminReportRoom(user?.isAdmin || false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await API.get("/admin/reports", { params });
      setReports(data.reports || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandReport = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await API.post(`/admin/reports/${reportId}/resolve`, {
        resolution: "Reviewed and resolved",
      });
      toast.success("Report resolved");
      fetchReports();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to resolve report");
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await API.post(`/admin/reports/${reportId}/dismiss`, {
        reason: "Dismissed",
      });
      toast.success("Report dismissed");
      fetchReports();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to dismiss report");
    }
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-32">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 relative">
          <button
            onClick={() => navigate("/settings")}
            className="absolute right-0 top-0 p-2 rounded-lg hover:bg-base-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-4xl font-bold mb-2 text-base-content pr-12">
            Message Reports
          </h1>
          <p className="text-base-content/70">
            Review and manage user reports about messages
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2">
          {["PENDING", "RESOLVED", "DISMISSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-base-200 text-base-content hover:bg-base-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
            <p className="text-muted-foreground">No reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report._id}
                className="border border-base-300 rounded-lg overflow-hidden bg-white dark:bg-slate-900"
              >
                {/* Report Header */}
                <div className="p-4 bg-base-100 dark:bg-slate-800 cursor-pointer hover:bg-base-200 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => toggleExpandReport(report._id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={report.reportedBy.avatar || ""}
                            alt={report.reportedBy.name}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "";
                            }}
                          />
                          <div>
                            <p className="font-semibold text-sm">
                              {report.reportedBy.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {report.reportedBy.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        Reason: {report.reason}
                      </p>
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {report.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === "PENDING"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                            : report.status === "RESOLVED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {report.status}
                      </span>
                      {expandedReports.has(report._id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatChatTime(report.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Message Report
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedReports.has(report._id) && (
                  <div className="border-t border-base-300 p-4 space-y-4">
                    {/* Reported Message Details */}
                    {report.messageDetails && (
                      <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4 space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Reported Message
                        </h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="text-sm font-medium">
                              {report.messageDetails.sender.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Channel</p>
                            <p className="text-sm font-medium">
                              {report.messageDetails.chatName}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Message Content</p>
                            <div className="space-y-2 mt-1">
                              {report.messageDetails.content && (
                                <p className="text-sm bg-base-100 dark:bg-slate-800 p-3 rounded break-words">
                                  {report.messageDetails.content}
                                </p>
                              )}
                              {/* Show signed URL link for image if present */}
                              {(report.messageDetails as any).imageSignedUrl && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <a
                                    href={(report.messageDetails as any).imageSignedUrl}
                                    download
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors inline-flex items-center gap-2"
                                  >
                                    <span>⬇️ Download Image</span>
                                    <span className="text-xs">(expires in 5 min)</span>
                                  </a>
                                </div>
                              )}
                              {!report.messageDetails.content && !(report.messageDetails as any).imageSignedUrl && (
                                <p className="text-sm bg-base-100 dark:bg-slate-800 p-3 rounded text-muted-foreground">
                                  (No content)
                                </p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Posted</p>
                            <p className="text-sm">
                              {formatChatTime(report.messageDetails.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {report.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolveReport(report._id)}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleDismissReport(report._id)}
                          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
