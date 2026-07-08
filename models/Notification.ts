import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "monitor_alert";
  isActive: boolean;
  scholarshipId?: mongoose.Types.ObjectId;
  /** populated only for monitor_alert notifications */
  monitorLogId?: mongoose.Types.ObjectId;
  /** category targeting for manual notifications */
  targetCategory?: string;
  personalEmail?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "monitor_alert"],
      default: "info",
    },
    isActive: { type: Boolean, default: true },
    scholarshipId: { type: Schema.Types.ObjectId, ref: "Scholarship", default: null },
    monitorLogId: { type: Schema.Types.ObjectId, ref: "ScholarshipMonitorLog", default: null },
    targetCategory: { type: String, default: "all" },
    personalEmail: { type: String, default: "" },
  },
  { timestamps: true }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;