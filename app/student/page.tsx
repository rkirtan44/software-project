export const dynamic = "force-dynamic";
import StudentDashboard from "@/components/student-dashboard"

export const metadata = {
  title: "Student Dashboard - ScholarPath",
  description: "View and track your scholarship applications",
}

export default function StudentPage() {
  return <StudentDashboard />
}
