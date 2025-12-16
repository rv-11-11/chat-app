import { create } from "zustand";

export interface Report {
  _id: string;
  reportedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  targetType: string;
  targetId: string;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  resolution?: string;
  resolvedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  messageDetails?: {
    content: string;
    sender: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    chatId: string;
    chatName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportsStore {
  reports: Report[];
  setReports: (reports: Report[]) => void;
  addReport: (report: Report) => void;
  updateReport: (reportId: string, updates: Partial<Report>) => void;
  removeReport: (reportId: string) => void;
  clearReports: () => void;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  reports: [],

  setReports: (reports: Report[]) => set({ reports }),

  addReport: (report: Report) =>
    set((state) => {
      // Avoid duplicates
      if (state.reports.some((r) => r._id === report._id)) {
        return state;
      }
      return { reports: [report, ...state.reports] };
    }),

  updateReport: (reportId: string, updates: Partial<Report>) =>
    set((state) => ({
      reports: state.reports.map((report) =>
        report._id === reportId
          ? { ...report, ...updates }
          : report
      ),
    })),

  removeReport: (reportId: string) =>
    set((state) => ({
      reports: state.reports.filter((r) => r._id !== reportId),
    })),

  clearReports: () => set({ reports: [] }),
}));
