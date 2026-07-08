export type Language = "en"

export const translations: Record<Language, Record<string, string>> = {
  en: {
    siteName: "ScholarHub", home: "Home", studentDashboard: "Student Dashboard",
    adminDashboard: "Admin Dashboard", switchLanguage: "Language",
    langSelectTitle: "Choose Your Language", langSelectSubtitle: "Select a language to continue to the Scholarship Portal",
    langEnglish: "English", langContinue: "Continue",
    heroTitle: "Discover Scholarships That Shape Your Future",
    heroSubtitle: "Browse through hundreds of scholarships from top institutions and government programs. Apply with ease and track your progress.",
    browseScholarships: "Browse Scholarships", goToStudentDashboard: "Student Dashboard",
    availableScholarships: "Available Scholarships", amount: "Amount", deadline: "Deadline",
    eligibility: "Eligibility", viewDetails: "View Details", applyNow: "Apply Now",
    noScholarships: "No scholarships available yet.", featuredScholarships: "Featured Scholarships",
    allScholarships: "All Scholarships", studentDashboardTitle: "Student Dashboard",
    studentDashboardSubtitle: "View your scholarship applications and track their status",
    myApplications: "My Applications", scholarshipName: "Scholarship Name",
    appliedDate: "Applied Date", status: "Status", actions: "Actions",
    noApplications: "You have not applied to any scholarships yet.", browseAndApply: "Browse & Apply",
    totalApplications: "Total Applications", approved: "Approved", pending: "Pending",
    rejected: "Rejected", applied: "Applied", viewScholarship: "View Scholarship",
    scholarshipDetails: "Scholarship Details", description: "Description", category: "Category",
    provider: "Provider", applicationDeadline: "Application Deadline", scholarshipAmount: "Scholarship Amount",
    eligibilityCriteria: "Eligibility Criteria", applyForScholarship: "Apply for This Scholarship",
    alreadyApplied: "Already Applied", applicationSubmitted: "Application Submitted Successfully!",
    back: "Back", backToHome: "Back to Home", adminDashboardTitle: "Admin Dashboard",
    adminDashboardSubtitle: "Manage scholarships and review student applications",
    manageScholarships: "Manage Scholarships", studentApplications: "Student Applications",
    addScholarship: "Add Scholarship", editScholarship: "Edit Scholarship",
    deleteScholarship: "Delete Scholarship", scholarshipTitle: "Title",
    scholarshipDescription: "Description", scholarshipCategory: "Category",
    scholarshipProvider: "Provider", scholarshipEligibility: "Eligibility",
    scholarshipDeadline: "Deadline", scholarshipAmountLabel: "Amount",
    save: "Save", cancel: "Cancel", edit: "Edit", delete: "Delete", approve: "Approve", reject: "Reject",
    confirmDelete: "Are you sure you want to delete this scholarship?",
    studentName: "Student Name", noStudentApplications: "No student applications yet.",
    totalScholarships: "Total Scholarships", statusApplied: "Applied", statusPending: "Pending",
    statusApproved: "Approved", statusRejected: "Rejected",
    catEngineering: "Engineering", catMedical: "Medical", catArts: "Arts",
    catScience: "Science", catCommerce: "Commerce", catGeneral: "General",
    footerText: "ScholarHub - Empowering Students Through Education", allRightsReserved: "All rights reserved.",
    contactDescription: "We'd love to hear from you. Fill out the form below and we'll get back to you soon.",
    name: "Name", enterName: "Enter your name", email: "Email", enterEmail: "Enter your email",
    message: "Message", enterMessage: "Write your message here...", sendMessage: "Send Message",
    studentProfileTitle: "Student Profile", personalInformation: "Personal Information",
    academicInformation: "Academic Information", fullName: "Full Name", emailAddress: "Email Address",
    phoneNumber: "Phone Number", address: "Address", course: "Course", university: "University", year: "Year",
    gender: "Gender", casteCategory: "Caste Category", annualIncome: "Annual Income", perYear: "per year",
    tenthPercentage: "10th Percentage", twelfthPercentage: "12th Percentage",
    male: "Male", female: "Female", obc: "OBC", sc: "SC", st: "ST", general: "General",
    firstYear: "First Year", secondYear: "Second Year", thirdYear: "Third Year", fourthYear: "Fourth Year",
    dateOfBirth: "Date of Birth", scholarships: "Scholarships", contactUs: "Contact Us", Search: "Search",
    documentsVaultTitle: "Document Vault",
    documentsVaultSubtitle: "Upload and store scholarship documents safely on this device (offline).",
    uploadDocument: "Upload Document", uploadDocumentHint: "You can upload any document used in scholarships.",
    chooseFile: "Choose file", documentName: "Document name",
    documentNamePlaceholder: "e.g. Income Certificate 2025", documentType: "Document type",
    notes: "Notes", notesPlaceholder: "Optional…", saveDocument: "Save document", saving: "Saving…",
    refresh: "Refresh", myDocuments: "My Documents",
    myDocumentsHint: "Search, download, or delete your stored documents.",
    searchDocuments: "Search documents…", loading: "Loading…", files: "files", size: "Size",
    uploaded: "Uploaded", download: "Download", noDocuments: "No documents saved yet.",
    studentIncome: "Student Income", recommendedScholarships: "Recommended Scholarships",
    scholarshipType: "Scholarship Type", allTypes: "All Types", allCourses: "All Courses",
    allCategories: "All Categories", courseSchool: "School", courseCollege: "College",
    state: "State", statePlaceholder: "Type state...", showing: "Showing", recommended: "Recommended",
    eligibleFor: "Eligible for", typeCentral: "Central", typeState: "State", typeTrust: "Trust",
    any: "Any", loginRequired: "Please login first",
    searchPlaceholder: "Search scholarships...",
    login: "Login",
  },
}

// Scholarship type used across the app
export type Scholarship = {
  id: string
  title: string
  titleHi?: string
  titleGu?: string
  description: string
  descriptionHi?: string
  descriptionGu?: string
  category: string
  provider: string
  eligibility: string
  eligibilityHi?: string
  eligibilityGu?: string
  amount: string
  deadline: string
}

export type Application = {
  id: string
  scholarshipId: string
  scholarshipTitle: string
  studentName: string
  appliedDate: string
  status: "applied" | "pending" | "approved" | "rejected"
}

export const defaultScholarships: Scholarship[] = [
  { id: "1", title: "National Means-cum-Merit Scholarship", description: "₹12,000 per year for Class 8 students", category: "Any", provider: "Central Government", eligibility: "Family income below ₹3,50,000", amount: "12,000", deadline: "2026-06-30" },
  { id: "2", title: "Ganesh Patiben Scholarship", description: "Financial support for tribal students", category: "ST", provider: "Trust", eligibility: "Family income below ₹1,00,000", amount: "25,000", deadline: "2026-05-15" },
  { id: "3", title: "National Means-cum-Merit Scholarship (NMMS)", description: "Scholarship for meritorious students from economically weaker sections", category: "Any", provider: "Central Government", eligibility: "Family income below ₹2,00,000", amount: "15,000", deadline: "2026-07-31" },
  { id: "4", title: "Digital Gujarat Scholarship", description: "State government scholarship schemes", category: "SC/ST/OBC", provider: "State Government", eligibility: "Gujarat students", amount: "Variable", deadline: "2026-04-30" },
  { id: "5", title: "National Merit Scholarship", description: "For OBC engineering students", category: "OBC", provider: "Central Government", eligibility: "Engineering students, income below ₹2,00,000", amount: "50,000", deadline: "2026-08-15" },
  { id: "6", title: "General Talent Scholarship", description: "For high merit students", category: "General", provider: "Trust", eligibility: "Merit-based selection", amount: "30,000", deadline: "2026-09-30" },
  { id: "7", title: "Mukhyamantri Scholarship Scheme Gujarat", description: "State government scholarship for Gujarat students", category: "Any", provider: "State Government", eligibility: "Gujarat domicile students", amount: "40,000", deadline: "2026-10-15" },
  { id: "8", title: "SC/ST Scholarship", description: "For SC/ST students", category: "SC", provider: "State Government", eligibility: "SC/ST category students", amount: "35,000", deadline: "2026-11-01" },
  { id: "9", title: "Digital Gujarat Scholarship (College)", description: "Scholarship provided by Gujarat government", category: "Any", provider: "State Government", eligibility: "College students from Gujarat", amount: "45,000", deadline: "2026-12-01" },
  { id: "10", title: "Engineering Excellence Scholarship", description: "Support for engineering students", category: "Engineering", provider: "AICTE", eligibility: "Engineering students with 75%+", amount: "60,000", deadline: "2026-07-15" },
  { id: "11", title: "Digital Gujarat Scholarship", description: "Scholarship provided by Gujarat government.", category: "General", provider: "State Government", eligibility: "Family income below ₹2,50,000", amount: "25,000", deadline: "2026-10-31" },
  { id: "12", title: "INSPIRE Scholarship", description: "Scholarship for science students by Government of India.", category: "Science", provider: "Central Government", eligibility: "Science students with strong academic record", amount: "60,000", deadline: "2026-09-30" },
  { id: "13", title: "National Scholarship Portal (NSP)", description: "Central Government scholarships for Indian students.", category: "General", provider: "Central Government", eligibility: "Income below ₹2,50,000", amount: "50,000", deadline: "2026-11-30" },
  { id: "14", title: "Post Matric Scholarship for SC Students", description: "Government scholarship for SC category students.", category: "General", provider: "Central Government", eligibility: "SC students with income below ₹2,00,000", amount: "40,000", deadline: "2026-12-15" },
  { id: "15", title: "Post Matric Scholarship for ST Students", description: "Government scholarship for ST category students.", category: "General", provider: "Central Government", eligibility: "ST students with income below ₹2,00,000", amount: "40,000", deadline: "2026-12-15" },
  { id: "16", title: "Post Matric Scholarship for OBC Students", description: "Government scholarship for OBC students.", category: "General", provider: "Central Government", eligibility: "OBC students with income below ₹2,50,000", amount: "35,000", deadline: "2026-12-20" },
  { id: "17", title: "AICTE Pragati Scholarship for Girls", description: "Scholarship for girl students in technical education.", category: "Engineering", provider: "Central Government", eligibility: "Girls pursuing engineering diploma/degree", amount: "50,000", deadline: "2026-10-10" },
  { id: "18", title: "AICTE Saksham Scholarship", description: "Scholarship for differently-abled students.", category: "Engineering", provider: "Central Government", eligibility: "Differently-abled students in technical education", amount: "50,000", deadline: "2026-10-10" },
  { id: "19", title: "INSPIRE Scholarship", description: "Scholarship for science students by Government of India.", category: "Science", provider: "Central Government", eligibility: "Science students with 85%+ marks", amount: "60,000", deadline: "2026-09-30" },
  { id: "20", title: "Prime Minister Scholarship Scheme", description: "Scholarship for wards of defence personnel.", category: "General", provider: "Central Government", eligibility: "Children of defence personnel", amount: "75,000", deadline: "2026-11-01" },
  { id: "21", title: "National Scholarship Portal (NSP)", description: "Central Government scholarships for Indian students.", category: "General", provider: "Central Government", eligibility: "Income below ₹2,50,000", amount: "50,000", deadline: "2026-12-01" },
  { id: "22", title: "Post Matric Scholarship for SC Students", description: "Government scholarship for SC category students.", category: "General", provider: "Central Government", eligibility: "SC students with income below ₹2,00,000", amount: "40,000", deadline: "2026-12-10" },
  { id: "23", title: "Post Matric Scholarship for ST Students", description: "Government scholarship for ST category students.", category: "General", provider: "Central Government", eligibility: "ST students with income below ₹2,00,000", amount: "40,000", deadline: "2026-12-10" },
  { id: "24", title: "Post Matric Scholarship for OBC Students", description: "Government scholarship for OBC students.", category: "General", provider: "Central Government", eligibility: "OBC students with income below ₹2,50,000", amount: "35,000", deadline: "2026-12-15" },
  { id: "25", title: "Merit-cum-Means Scholarship for Minority Students", description: "Scholarship for minority students based on merit and income.", category: "General", provider: "Central Government", eligibility: "Minority students with income below ₹2,50,000", amount: "50,000", deadline: "2026-11-20" },
  { id: "26", title: "AICTE Pragati Scholarship for Girls", description: "Scholarship for girl students in technical education.", category: "Engineering", provider: "Central Government", eligibility: "Girls pursuing engineering diploma/degree", amount: "50,000", deadline: "2026-10-15" },
  { id: "27", title: "AICTE Saksham Scholarship", description: "Scholarship for differently-abled students.", category: "Engineering", provider: "Central Government", eligibility: "Differently-abled students in technical education", amount: "50,000", deadline: "2026-10-15" },
  { id: "28", title: "Merit-cum-Means Scholarship for Minority Students", description: "Scholarship for minority students based on merit and income.", category: "General", provider: "Central Government", eligibility: "Minority students with income below ₹2,50,000", amount: "50,000", deadline: "2026-11-20" },
  { id: "29", title: "LIC Golden Jubilee Scholarship", description: "Approx ₹20,000 Merit + Need based scholarship.", category: "General", provider: "Trust", eligibility: "EWS students with income below ₹1,00,000", amount: "20,000", deadline: "2026-09-30" },
]
