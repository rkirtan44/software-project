import ScholarshipForm from "@/components/admin/ScholarshipForm";

export default function NewScholarshipPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Scholarship</h1>
      <ScholarshipForm />
    </div>
  );
}