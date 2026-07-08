import mongoose, { Schema, Document, Model } from "mongoose";

export type ChangeField =
  | "deadline"
  | "amount"
  | "eligibility"
  | "isActive"
  | "status"
  | "applyLink"
  | "description"
  | "title"
  | "other";

export type AlertSeverity = "urgent" | "high" | "medium" | "low";
export type MonitorStatus = "changed" | "unreachable" | "ok" | "error";

export interface IMonitorChange {
  field: ChangeField;
  oldValue: string;
  newValue: string;
  suggestedAction: string;
}

export interface IScholarshipMonitorLog extends Document {
  scholarshipId: mongoose.Types.ObjectId;
  scholarshipTitle: string;
  sourceUrl: string;
  status: MonitorStatus;
  changes: IMonitorChange[];
  severity: AlertSeverity;
  notificationId?: mongoose.Types.ObjectId;
  /** true once the admin has acknowledged / resolved this alert */
  resolved: boolean;
  resolvedAt?: Date;
  checkedAt: Date;
  errorMessage?: string;
}

const MonitorChangeSchema = new Schema<IMonitorChange>(
  {
    field: { type: String, required: true },
    oldValue: { type: String, required: true },
    newValue: { type: String, required: true },
    suggestedAction: { type: String, required: true },
  },
  { _id: false }
);

const ScholarshipMonitorLogSchema = new Schema<IScholarshipMonitorLog>(
  {
    scholarshipId: { type: Schema.Types.ObjectId, ref: "Scholarship", required: true },
    scholarshipTitle: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["changed", "unreachable", "ok", "error"],
      required: true,
    },
    changes: [MonitorChangeSchema],
    severity: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      default: "medium",
    },
    notificationId: { type: Schema.Types.ObjectId, ref: "Notification", default: null },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    checkedAt: { type: Date, default: Date.now },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for fast lookups by scholarship + unresolved alerts
ScholarshipMonitorLogSchema.index({ scholarshipId: 1, resolved: 1 });
ScholarshipMonitorLogSchema.index({ checkedAt: -1 });

const ScholarshipMonitorLog: Model<IScholarshipMonitorLog> =
  mongoose.models.ScholarshipMonitorLog ||
  mongoose.model<IScholarshipMonitorLog>(
    "ScholarshipMonitorLog",
    ScholarshipMonitorLogSchema
  );

export default ScholarshipMonitorLog;
