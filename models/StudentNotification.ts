import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudentNotification extends Document {
  userEmail: string;
  title: string;
  message: string;
  type: "reply" | "scholarship" | "info";
  isRead: boolean;
  createdAt: Date;
}

const StudentNotificationSchema = new Schema<IStudentNotification>(
  {
    userEmail:  { type: String, required: true },
    title:      { type: String, required: true },
    message:    { type: String, required: true },
    type:       { type: String, enum: ["reply", "scholarship", "info"], default: "info" },
    isRead:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

StudentNotificationSchema.index({ userEmail: 1, createdAt: -1 });

const StudentNotification: Model<IStudentNotification> =
  mongoose.models.StudentNotification ||
  mongoose.model<IStudentNotification>("StudentNotification", StudentNotificationSchema);

export default StudentNotification;
