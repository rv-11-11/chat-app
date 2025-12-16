import mongoose, { Document, Schema } from "mongoose";

export enum ReportStatus {
  PENDING = "PENDING",
  REVIEWING = "REVIEWING",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export enum ReportTargetType {
  USER = "USER",
  MESSAGE = "MESSAGE",
  CHAT = "CHAT",
}

export interface ReportDocument extends Document {
  reportedBy: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  reason: string;
  description: string;
  status: ReportStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<ReportDocument>(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(ReportTargetType),
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolution: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });

const ReportModel = mongoose.model<ReportDocument>("Report", reportSchema);
export default ReportModel;
