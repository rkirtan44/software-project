import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";

// College-level scholarships only (school scholarships removed)
const DATA = [
  {
    title: "National Merit Scholarship",
    gender: "Any", category: ["OBC"], course: "College", state: "Any", level: "Central", income: 800000, amount: 12000, deadline: new Date("2026-03-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=National+Merit+Scholarship", description: "Central government scholarship for meritorious OBC students.", eligibility: "OBC students with 60%+ in 10+2, income ≤ ₹8 lakh.", documents: "Income certificate, OBC certificate, marksheet, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Post Matric Scholarship SC/ST",
    gender: "Any", category: ["SC", "ST"], course: "College", state: "Any", level: "Central", income: 250000, amount: 15000, deadline: new Date("2025-10-15"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Post+Matric+SC+ST", description: "Ministry of Social Justice scholarship for SC/ST students.", eligibility: "SC/ST students, income ≤ ₹2.5 lakh.", documents: "Caste certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Central Sector Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 450000, amount: 10000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Central+Sector+Scholarship", description: "For top 20 percentile of Class 12 students.", eligibility: "Top 20 percentile in board, income ≤ ₹4.5 lakh.", documents: "Board marksheet, income certificate, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Pragati Scholarship for Girls",
    gender: "Female", category: ["General"], course: "College", state: "Any", level: "Central", income: 800000, amount: 50000, deadline: new Date("2025-11-30"), applyLink: "https://www.aicte-india.org", youtubeLink: "https://youtube.com/results?search_query=Pragati+Scholarship+AICTE", description: "AICTE scholarship for girl students in technical education.", eligibility: "Girl students in AICTE-approved programs, income ≤ ₹8 lakh.", documents: "Income certificate, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Saksham Scholarship Divyang",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 800000, amount: 50000, deadline: new Date("2025-11-30"), applyLink: "https://www.aicte-india.org", youtubeLink: "https://youtube.com/results?search_query=Saksham+Scholarship+AICTE", description: "AICTE scholarship for specially-abled students.", eligibility: "Divyang students 40%+ disability, income ≤ ₹8 lakh.", documents: "Disability certificate, income certificate, Aadhaar, marksheet", isActive: true
  },
  {
    title: "Inspire Scholarship SHE",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 80000, deadline: new Date("2025-11-30"), applyLink: "https://online-inspire.gov.in", youtubeLink: "https://youtube.com/results?search_query=INSPIRE+SHE+Scholarship", description: "DST scholarship for top students in basic sciences.", eligibility: "Top 1% in Class 12, B.Sc/M.Sc.", documents: "Board marksheet, rank proof, admission letter, Aadhaar", isActive: true
  },
  {
    title: "KVPY Fellowship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 84000, deadline: new Date("2026-06-30"), applyLink: "https://kvpy.iisc.ac.in", youtubeLink: "https://youtube.com/results?search_query=KVPY+Scholarship", description: "IISc fellowship for students pursuing research in basic science.", eligibility: "Class 11 to 1st year B.Sc, aptitude test.", documents: "Marksheet, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Post Matric Scholarship Minorities",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 200000, amount: 12000, deadline: new Date("2025-10-15"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Post+Matric+Minority+Scholarship", description: "Central scholarship for minority post-matric students.", eligibility: "Minority, post-matric, 50%+, income ≤ ₹2 lakh.", documents: "Minority certificate, income certificate, admission proof, Aadhaar", isActive: true
  },
  {
    title: "Merit cum Means Minority Scholarship",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 250000, amount: 30000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Merit+cum+Means+Minority", description: "For minority students in technical/professional courses.", eligibility: "Minority, technical course, 50%+, income ≤ ₹2.5 lakh.", documents: "Minority certificate, income certificate, admission letter, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Maulana Azad National Fellowship",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 300000, deadline: new Date("2026-06-30"), applyLink: "https://ugc.ac.in", youtubeLink: "https://youtube.com/results?search_query=Maulana+Azad+Fellowship", description: "UGC fellowship for minority M.Phil/PhD students.", eligibility: "Minority, UGC-NET qualified, M.Phil/PhD admitted.", documents: "NET certificate, admission letter, minority certificate, Aadhaar", isActive: true
  },
  {
    title: "Rajiv Gandhi National Fellowship SC ST",
    gender: "Any", category: ["SC", "ST"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 300000, deadline: new Date("2026-06-30"), applyLink: "https://ugc.ac.in", youtubeLink: "https://youtube.com/results?search_query=Rajiv+Gandhi+Fellowship+SC+ST", description: "UGC fellowship for SC/ST M.Phil/PhD students.", eligibility: "SC/ST, UGC-NET or PhD admission.", documents: "Caste certificate, NET/admission proof, Aadhaar", isActive: true
  },
  {
    title: "Top Class Education for SC",
    gender: "Any", category: ["SC"], course: "College", state: "Any", level: "Central", income: 600000, amount: 200000, deadline: new Date("2025-12-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Top+Class+Education+SC", description: "Ministry of Social Justice for SC students in top institutions.", eligibility: "SC, top notified institution, income ≤ ₹6 lakh.", documents: "Caste certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Top Class Education for ST",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 600000, amount: 200000, deadline: new Date("2025-12-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Top+Class+Education+ST", description: "Ministry of Tribal Affairs for ST students in top institutions.", eligibility: "ST, top notified institution, income ≤ ₹6 lakh.", documents: "ST certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Post Matric Scholarship for ST",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 250000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=ST+Post+Matric+Scholarship", description: "Central post-matric scholarship for Scheduled Tribe students.", eligibility: "ST, post-matric, income ≤ ₹2.5 lakh.", documents: "ST certificate, income certificate, admission letter, marksheet, Aadhaar", isActive: true
  },
  {
    title: "NSP OBC Post Matric Scholarship",
    gender: "Any", category: ["OBC"], course: "College", state: "Any", level: "Central", income: 100000, amount: 10000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=OBC+Post+Matric+Scholarship", description: "Central post-matric scholarship for OBC students.", eligibility: "OBC, post-matric, income ≤ ₹1 lakh.", documents: "OBC certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "National Overseas Scholarship ST",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 600000, amount: 2500000, deadline: new Date("2026-03-31"), applyLink: "https://nosmsje.gov.in", youtubeLink: "https://youtube.com/results?search_query=National+Overseas+Scholarship+ST", description: "For ST students studying Masters/PhD abroad.", eligibility: "ST, below 35 yrs, foreign university Masters/PhD, income ≤ ₹6 lakh.", documents: "ST certificate, income certificate, foreign admission letter, passport, Aadhaar", isActive: true
  },
  {
    title: "Ambedkar Post Matric Scholarship Gujarat",
    gender: "Any", category: ["SC"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 15000, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Ambedkar+Scholarship+Gujarat", description: "Gujarat state scholarship for SC students in post-matric courses.", eligibility: "SC domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.", documents: "SC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "MYSY Scholarship Gujarat",
    gender: "Any", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 30000, deadline: new Date("2025-09-30"), applyLink: "https://mysy.guj.nic.in", youtubeLink: "https://youtube.com/results?search_query=MYSY+Scholarship+Gujarat", description: "Mukhyamantri Yuva Swavalamban Yojana for Gujarat students.", eligibility: "Gujarat domicile, 80%+ in Class 10/12, income ≤ ₹6 lakh.", documents: "Gujarat domicile, income certificate, marksheet, Aadhaar, admission letter", isActive: true
  },
  {
    title: "Swarnim Gujarat Scholarship ST",
    gender: "Any", category: ["ST"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+ST+Scholarship", description: "Gujarat state scholarship for Scheduled Tribe students.", eligibility: "ST domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.", documents: "ST certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "OBC Post Matric Scholarship Gujarat",
    gender: "Any", category: ["OBC"], course: "College", state: "Gujarat", level: "State", income: 300000, amount: 12000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+OBC+Scholarship", description: "Gujarat state scholarship for OBC students in post-matric courses.", eligibility: "OBC domicile Gujarat, post-matric, income ≤ ₹3 lakh.", documents: "OBC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "EBC Post Matric Scholarship Gujarat",
    gender: "Any", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 150000, amount: 8000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+EBC+Scholarship", description: "Gujarat state scholarship for Economically Backward Class students.", eligibility: "EBC Gujarat domicile, post-matric, income ≤ ₹1.5 lakh.", documents: "EBC/income certificate, Gujarat domicile, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Minority Post Matric Scholarship Gujarat",
    gender: "Any", category: ["Minority"], course: "College", state: "Gujarat", level: "State", income: 200000, amount: 12000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+Minority+Scholarship", description: "Gujarat state post-matric scholarship for minority students.", eligibility: "Minority domicile of Gujarat, post-matric, income ≤ ₹2 lakh.", documents: "Minority certificate, Gujarat domicile, income certificate, admission proof, Aadhaar", isActive: true
  },
  {
    title: "Dr Ambedkar Merit Scholarship Gujarat",
    gender: "Any", category: ["SC"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 25000, deadline: new Date("2025-12-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Ambedkar+Merit+Scholarship+Gujarat", description: "Merit-based scholarship for top SC students in Gujarat colleges.", eligibility: "SC Gujarat domicile, 70%+ in Class 12, income ≤ ₹6 lakh.", documents: "SC certificate, Class 12 marksheet, admission letter, income certificate, Aadhaar", isActive: true
  },
  {
    title: "Digital Gujarat Scholarship",
    gender: "Any", category: ["General", "SC", "ST", "OBC"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://digitalgujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Digital+Gujarat+Scholarship", description: "Gujarat government online scholarship portal for all categories.", eligibility: "Gujarat domicile, SC/ST/OBC/EBC/Minority, college enrolled, income ≤ ₹6 lakh.", documents: "Gujarat domicile, category certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Ganshaktiben Scholarship Gujarat Girls",
    gender: "Female", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 10000, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+girl+scholarship+esamajkalyan", description: "Gujarat scholarship for meritorious girl students from economically weaker families.", eligibility: "Girl students, Gujarat domicile, 60%+ in last exam, income ≤ ₹2.5 lakh.", documents: "Gujarat domicile, income certificate, marksheet, Aadhaar, admission letter", isActive: true
  },
  {
    title: "Tata Capital Pankh Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 400000, amount: 12000, deadline: new Date("2025-07-31"), applyLink: "https://www.buddy4study.com/tata-capital-pankh-scholarship", youtubeLink: "https://youtube.com/results?search_query=Tata+Capital+Pankh+Scholarship", description: "Tata Capital scholarship for Class 11-graduation students.", eligibility: "Class 11-graduation, 60%+ marks, income ≤ ₹4 lakh.", documents: "Income certificate, marksheet, admission proof, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Sitaram Jindal Foundation Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 250000, amount: 24000, deadline: new Date("2025-06-30"), applyLink: "https://sitaramjindalfoundation.org", youtubeLink: "https://youtube.com/results?search_query=Sitaram+Jindal+Foundation+Scholarship", description: "Private foundation scholarship for meritorious poor students.", eligibility: "60%+ marks, income ≤ ₹2.5 lakh.", documents: "Income certificate, marksheet, admission proof, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Vidyasaarathi Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 600000, amount: 25000, deadline: new Date("2026-06-30"), applyLink: "https://www.vidyasaarathi.co.in", youtubeLink: "https://youtube.com/results?search_query=Vidyasaarathi+Scholarship", description: "Corporate-funded scholarship portal for various courses.", eligibility: "Generally 60%+, income ≤ ₹6 lakh.", documents: "Marksheet, income certificate, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Reliance Foundation Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 600000, amount: 400000, deadline: new Date("2026-06-30"), applyLink: "https://reliancefoundation.org/scholarships", youtubeLink: "https://youtube.com/results?search_query=Reliance+Foundation+Scholarship", description: "Reliance Foundation merit-cum-means scholarship for UG students.", eligibility: "1st year UG, 60%+ in Class 12, income ≤ ₹6 lakh.", documents: "Income certificate, Class 12 marksheet, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Aditya Birla Scholarship",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 999999999, amount: 65000, deadline: new Date("2026-06-30"), applyLink: "https://www.adityabirlascholars.net", youtubeLink: "https://youtube.com/results?search_query=Aditya+Birla+Scholarship", description: "Prestigious merit-based scholarship for students in top colleges.", eligibility: "Admitted to select top institutions, merit-based selection.", documents: "Admission letter, Class 12 marksheet, Aadhaar, bank passbook", isActive: true
  },
];

export async function GET() {
  try {
    await connectDB();
    await Scholarship.deleteMany({});
    const result = await Scholarship.insertMany(DATA);
    return NextResponse.json({
      message: `✅ ${result.length} college scholarships seeded successfully!`,
      count: result.length
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
