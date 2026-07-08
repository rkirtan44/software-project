import mongoose, { Schema, Document } from "mongoose";

export interface IScholarship extends Document {
  title: string;
  titleHi?: string;
  titleGu?: string;
  description: string;
  amount: number;
  eligibility: string;
  category: string[];
  deadline: Date;
  applyLink?: string;
  youtubeLink?: string;
  isActive: boolean;
  level: string;
  course: string;
  state: string;
  gender: string;
  income: number;
  documents?: string;
  applicants: mongoose.Types.ObjectId[];
}

const ScholarshipSchema = new Schema<IScholarship>(
  {
    title: { type: String, required: true },
    titleHi: { type: String, default: "" },
    titleGu: { type: String, default: "" },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    eligibility: { type: String, required: true },
    category: [{ type: String }],
    deadline: { type: Date, required: true },
    applyLink: { type: String, default: "" },
    youtubeLink: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    level: { type: String, default: "Central" },
    course: { type: String, default: "College" },
    state: { type: String, default: "Any" },
    gender: { type: String, default: "Any" },
    income: { type: Number, default: 999999999 },
    documents: { type: String, default: "" },
    applicants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true, strict: true }
);

export default mongoose.models.Scholarship
  ? mongoose.models.Scholarship
  : mongoose.model<IScholarship>("Scholarship", ScholarshipSchema);