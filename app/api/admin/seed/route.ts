import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scholarship from "@/models/Scholarship";

const DATA = [
  {
    title: "National Merit Scholarship",
    titleHi: "राष्ट्रीय मेरिट छात्रवृत्ति",
    titleGu: "રાષ્ટ્રીય મેરિટ શિષ્યવૃત્તિ",
    gender: "Any", category: ["OBC"], course: "College", state: "Any", level: "Central", income: 800000, amount: 12000, deadline: new Date("2026-03-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=National+Merit+Scholarship", description: "Central government scholarship for meritorious OBC students.", eligibility: "OBC students with 60%+ in 10+2, income ≤ ₹8 lakh.", documents: "Income certificate, OBC certificate, marksheet, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Post Matric Scholarship SC/ST",
    titleHi: "पोस्ट मैट्रिक छात्रवृत्ति SC/ST",
    titleGu: "પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ SC/ST",
    gender: "Any", category: ["SC", "ST"], course: "College", state: "Any", level: "Central", income: 250000, amount: 15000, deadline: new Date("2025-10-15"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Post+Matric+SC+ST", description: "Ministry of Social Justice scholarship for SC/ST students.", eligibility: "SC/ST students, income ≤ ₹2.5 lakh.", documents: "Caste certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Central Sector Scholarship",
    titleHi: "केंद्रीय क्षेत्र छात्रवृत्ति",
    titleGu: "કેન્દ્રીય ક્ષેત્ર શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 450000, amount: 10000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Central+Sector+Scholarship", description: "For top 20 percentile of Class 12 students.", eligibility: "Top 20 percentile in board, income ≤ ₹4.5 lakh.", documents: "Board marksheet, income certificate, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Pragati Scholarship for Girls",
    titleHi: "छात्राओं के लिए प्रगति छात्रवृत्ति",
    titleGu: "છોકરીઓ માટે પ્રગતિ શિષ્યવૃત્તિ",
    gender: "Female", category: ["General"], course: "College", state: "Any", level: "Central", income: 800000, amount: 50000, deadline: new Date("2025-11-30"), applyLink: "https://www.aicte-india.org", youtubeLink: "https://youtube.com/results?search_query=Pragati+Scholarship+AICTE", description: "AICTE scholarship for girl students in technical education.", eligibility: "Girl students in AICTE-approved programs, income ≤ ₹8 lakh.", documents: "Income certificate, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Saksham Scholarship Divyang",
    titleHi: "सक्षम छात्रवृत्ति (दिव्यांग)",
    titleGu: "સક્ષમ શિષ્યવૃત્તિ (દિવ્યાંગ)",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 800000, amount: 50000, deadline: new Date("2025-11-30"), applyLink: "https://www.aicte-india.org", youtubeLink: "https://youtube.com/results?search_query=Saksham+Scholarship+AICTE", description: "AICTE scholarship for specially-abled students.", eligibility: "Divyang students 40%+ disability, income ≤ ₹8 lakh.", documents: "Disability certificate, income certificate, Aadhaar, marksheet", isActive: true
  },
  {
    title: "Inspire Scholarship SHE",
    titleHi: "इंस्पायर छात्रवृत्ति (SHE)",
    titleGu: "ઇન્સ્પાયર શિષ્યવૃત્તિ (SHE)",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 80000, deadline: new Date("2025-11-30"), applyLink: "https://online-inspire.gov.in", youtubeLink: "https://youtube.com/results?search_query=INSPIRE+SHE+Scholarship", description: "DST scholarship for top students in basic sciences.", eligibility: "Top 1% in Class 12, B.Sc/M.Sc.", documents: "Board marksheet, rank proof, admission letter, Aadhaar", isActive: true
  },
  {
    title: "KVPY Fellowship",
    titleHi: "KVPY फेलोशिप",
    titleGu: "KVPY ફેલોશિપ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 84000, deadline: new Date("2026-06-30"), applyLink: "https://kvpy.iisc.ac.in", youtubeLink: "https://youtube.com/results?search_query=KVPY+Scholarship", description: "IISc fellowship for students pursuing research in basic science.", eligibility: "Class 11 to 1st year B.Sc, aptitude test.", documents: "Marksheet, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "NMMS Scholarship",
    titleHi: "NMMS छात्रवृत्ति",
    titleGu: "NMMS શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "School", state: "Any", level: "Central", income: 150000, amount: 12000, deadline: new Date("2026-06-30"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=NMMS+Scholarship", description: "National Means-cum-Merit for Class 9-12.", eligibility: "Class 8 pass, 55%+ marks, income ≤ ₹1.5 lakh.", documents: "Class 8 marksheet, income certificate, Aadhaar", isActive: true
  },
  {
    title: "Pre Matric Scholarship Minorities",
    titleHi: "अल्पसंख्यक प्री मैट्रिक छात्रवृत्ति",
    titleGu: "લઘુમતી પ્રી મેટ્રિક શિષ્યવૃત્તિ",
    gender: "Any", category: ["Minority"], course: "School", state: "Any", level: "Central", income: 100000, amount: 10000, deadline: new Date("2025-09-15"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Pre+Matric+Minority+Scholarship", description: "Central scholarship for minority students Class 1 to 10.", eligibility: "Minority, class 1-10, 50%+ marks, income ≤ ₹1 lakh.", documents: "Minority certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Post Matric Scholarship Minorities",
    titleHi: "अल्पसंख्यक पोस्ट मैट्रिक छात्रवृत्ति",
    titleGu: "લઘુમતી પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 200000, amount: 12000, deadline: new Date("2025-10-15"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Post+Matric+Minority+Scholarship", description: "Central scholarship for minority post-matric students.", eligibility: "Minority, post-matric, 50%+, income ≤ ₹2 lakh.", documents: "Minority certificate, income certificate, admission proof, Aadhaar", isActive: true
  },
  {
    title: "Merit cum Means Minority Scholarship",
    titleHi: "अल्पसंख्यक मेरिट-कम-मीन्स छात्रवृत्ति",
    titleGu: "લઘુમતી મેરિટ-કમ-મીન્સ શિષ્યવૃત્તિ",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 250000, amount: 30000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Merit+cum+Means+Minority", description: "For minority students in technical/professional courses.", eligibility: "Minority, technical course, 50%+, income ≤ ₹2.5 lakh.", documents: "Minority certificate, income certificate, admission letter, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Maulana Azad National Fellowship",
    titleHi: "मौलाना आज़ाद राष्ट्रीय फेलोशिप",
    titleGu: "મૌલાના આઝાદ રાષ્ટ્રીય ફેલોશિપ",
    gender: "Any", category: ["Minority"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 300000, deadline: new Date("2026-06-30"), applyLink: "https://ugc.ac.in", youtubeLink: "https://youtube.com/results?search_query=Maulana+Azad+Fellowship", description: "UGC fellowship for minority M.Phil/PhD students.", eligibility: "Minority, UGC-NET qualified, M.Phil/PhD admitted.", documents: "NET certificate, admission letter, minority certificate, Aadhaar", isActive: true
  },
  {
    title: "Rajiv Gandhi National Fellowship SC ST",
    titleHi: "राजीव गांधी राष्ट्रीय फेलोशिप SC/ST",
    titleGu: "રાજીવ ગાંધી રાષ્ટ્રીય ફેલોશિપ SC/ST",
    gender: "Any", category: ["SC", "ST"], course: "College", state: "Any", level: "Central", income: 999999999, amount: 300000, deadline: new Date("2026-06-30"), applyLink: "https://ugc.ac.in", youtubeLink: "https://youtube.com/results?search_query=Rajiv+Gandhi+Fellowship+SC+ST", description: "UGC fellowship for SC/ST M.Phil/PhD students.", eligibility: "SC/ST, UGC-NET or PhD admission.", documents: "Caste certificate, NET/admission proof, Aadhaar", isActive: true
  },
  {
    title: "Top Class Education for SC",
    titleHi: "SC छात्रों के लिए टॉप क्लास शिक्षा छात्रवृत्ति",
    titleGu: "SC વિદ્યાર્થીઓ માટે ટોપ ક્લાસ શિષ્યવૃત્તિ",
    gender: "Any", category: ["SC"], course: "College", state: "Any", level: "Central", income: 600000, amount: 200000, deadline: new Date("2025-12-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Top+Class+Education+SC", description: "Ministry of Social Justice for SC students in top institutions.", eligibility: "SC, top notified institution, income ≤ ₹6 lakh.", documents: "Caste certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Top Class Education for ST",
    titleHi: "ST छात्रों के लिए टॉप क्लास शिक्षा छात्रवृत्ति",
    titleGu: "ST વિદ્યાર્થીઓ માટે ટોપ ક્લાસ શિષ્યવૃત્તિ",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 600000, amount: 200000, deadline: new Date("2025-12-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=Top+Class+Education+ST", description: "Ministry of Tribal Affairs for ST students in top institutions.", eligibility: "ST, top notified institution, income ≤ ₹6 lakh.", documents: "ST certificate, income certificate, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Pre Matric Scholarship for ST",
    titleHi: "ST छात्रों के लिए प्री मैट्रिक छात्रवृत्ति",
    titleGu: "ST વિદ્યાર્થીઓ માટે પ્રી મેટ્રિક શિષ્યવૃત્તિ",
    gender: "Any", category: ["ST"], course: "School", state: "Any", level: "Central", income: 250000, amount: 10000, deadline: new Date("2025-09-30"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=ST+Pre+Matric+Scholarship", description: "Ministry of Tribal Affairs for ST students Class 9-10.", eligibility: "ST, Class 9-10, 55%+ marks, income ≤ ₹2.5 lakh.", documents: "ST certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Post Matric Scholarship for ST",
    titleHi: "ST छात्रों के लिए पोस्ट मैट्रिक छात्रवृत्ति",
    titleGu: "ST વિદ્યાર્થીઓ માટે પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 250000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=ST+Post+Matric+Scholarship", description: "Central post-matric scholarship for Scheduled Tribe students.", eligibility: "ST, post-matric, income ≤ ₹2.5 lakh.", documents: "ST certificate, income certificate, admission letter, marksheet, Aadhaar", isActive: true
  },
  {
    title: "NSP OBC Post Matric Scholarship",
    titleHi: "NSP OBC पोस्ट मैट्रिक छात्रवृत्ति",
    titleGu: "NSP OBC પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ",
    gender: "Any", category: ["OBC"], course: "College", state: "Any", level: "Central", income: 100000, amount: 10000, deadline: new Date("2025-10-31"), applyLink: "https://scholarships.gov.in", youtubeLink: "https://youtube.com/results?search_query=OBC+Post+Matric+Scholarship", description: "Central post-matric scholarship for OBC students.", eligibility: "OBC, post-matric, income ≤ ₹1 lakh.", documents: "OBC certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Begum Hazrat Mahal Scholarship",
    titleHi: "बेगम हजरत महल छात्रवृत्ति",
    titleGu: "બેગમ હઝરત મહલ શિષ્યવૃત્તિ",
    gender: "Female", category: ["Minority"], course: "School", state: "Any", level: "Central", income: 200000, amount: 10000, deadline: new Date("2025-09-30"), applyLink: "https://www.maef.nic.in", youtubeLink: "https://youtube.com/results?search_query=Begum+Hazrat+Mahal+Scholarship", description: "MAEF scholarship for meritorious minority girls Class 9-12.", eligibility: "Minority girls, class 9-12, 50%+, income ≤ ₹2 lakh.", documents: "Minority certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "National Overseas Scholarship ST",
    titleHi: "ST छात्रों के लिए राष्ट्रीय विदेश छात्रवृत्ति",
    titleGu: "ST વિદ્યાર્થીઓ માટે રાષ્ટ્રીય વિદેશ શિષ્યવૃત્તિ",
    gender: "Any", category: ["ST"], course: "College", state: "Any", level: "Central", income: 600000, amount: 2500000, deadline: new Date("2026-03-31"), applyLink: "https://nosmsje.gov.in", youtubeLink: "https://youtube.com/results?search_query=National+Overseas+Scholarship+ST", description: "For ST students studying Masters/PhD abroad.", eligibility: "ST, below 35 yrs, foreign university Masters/PhD, income ≤ ₹6 lakh.", documents: "ST certificate, income certificate, foreign admission letter, passport, Aadhaar", isActive: true
  },
  {
    title: "Ambedkar Post Matric Scholarship Gujarat",
    titleHi: "अंबेडकर पोस्ट मैट्रिक छात्रवृत्ति गुजरात",
    titleGu: "આંબેડકર પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["SC"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 15000, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Ambedkar+Scholarship+Gujarat", description: "Gujarat state scholarship for SC students in post-matric courses.", eligibility: "SC domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.", documents: "SC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "MYSY Scholarship Gujarat",
    titleHi: "MYSY छात्रवृत्ति गुजरात",
    titleGu: "MYSY શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 30000, deadline: new Date("2025-09-30"), applyLink: "https://mysy.guj.nic.in", youtubeLink: "https://youtube.com/results?search_query=MYSY+Scholarship+Gujarat", description: "Mukhyamantri Yuva Swavalamban Yojana for Gujarat students.", eligibility: "Gujarat domicile, 80%+ in Class 10/12, income ≤ ₹6 lakh.", documents: "Gujarat domicile, income certificate, marksheet, Aadhaar, admission letter", isActive: true
  },
  {
    title: "Swarnim Gujarat Scholarship ST",
    titleHi: "स्वर्णिम गुजरात ST छात्रवृत्ति",
    titleGu: "સ્વર્ણિમ ગુજરાત ST શિષ્યવૃત્તિ",
    gender: "Any", category: ["ST"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+ST+Scholarship", description: "Gujarat state scholarship for Scheduled Tribe students.", eligibility: "ST domicile of Gujarat, post-matric, income ≤ ₹2.5 lakh.", documents: "ST certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Vanvasi Kalyan Scholarship Gujarat",
    titleHi: "वनवासी कल्याण छात्रवृत्ति गुजरात",
    titleGu: "વનવાસી કલ્યાણ શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["ST"], course: "School", state: "Gujarat", level: "State", income: 200000, amount: 8000, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+Vanvasi+Kalyan+Scholarship", description: "Gujarat scholarship for tribal students in school education.", eligibility: "ST domicile of Gujarat, school level, income ≤ ₹2 lakh.", documents: "ST certificate, Gujarat domicile, income certificate, school marksheet, Aadhaar", isActive: true
  },
  {
    title: "OBC Post Matric Scholarship Gujarat",
    titleHi: "OBC पोस्ट मैट्रिक छात्रवृत्ति गुजरात",
    titleGu: "OBC પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["OBC"], course: "College", state: "Gujarat", level: "State", income: 300000, amount: 12000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+OBC+Scholarship", description: "Gujarat state scholarship for OBC students in post-matric courses.", eligibility: "OBC domicile Gujarat, post-matric, income ≤ ₹3 lakh.", documents: "OBC certificate, Gujarat domicile, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "EBC Post Matric Scholarship Gujarat",
    titleHi: "EBC पोस्ट मैट्रिक छात्रवृत्ति गुजरात",
    titleGu: "EBC પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 150000, amount: 8000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+EBC+Scholarship", description: "Gujarat state scholarship for Economically Backward Class students.", eligibility: "EBC Gujarat domicile, post-matric, income ≤ ₹1.5 lakh.", documents: "EBC/income certificate, Gujarat domicile, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Kanya Kelavani Nidhi Gujarat",
    titleHi: "कन्या केलावणी निधि गुजरात",
    titleGu: "કન્યા કેળવણી નિધિ ગુજરાત",
    gender: "Female", category: ["General"], course: "School", state: "Gujarat", level: "State", income: 999999999, amount: 5000, deadline: new Date("2026-06-30"), applyLink: "https://gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Kanya+Kelavani+Gujarat", description: "Gujarat government support for girl students in school.", eligibility: "Girl students in government/aided schools in Gujarat.", documents: "School enrollment certificate, Aadhaar, bank passbook, birth certificate", isActive: true
  },
  {
    title: "Vidhyadhan Scholarship Gujarat SC",
    titleHi: "विद्याधन छात्रवृत्ति गुजरात SC",
    titleGu: "વિદ્યાધન શિષ્યવૃત્તિ ગુજરાત SC",
    gender: "Any", category: ["SC"], course: "School", state: "Gujarat", level: "State", income: 150000, amount: 7500, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+SC+School+Scholarship", description: "Gujarat state pre-matric scholarship for SC students.", eligibility: "SC Gujarat domicile, Class 9-10, income ≤ ₹1.5 lakh.", documents: "SC certificate, Gujarat domicile, school marksheet, income certificate, Aadhaar", isActive: true
  },
  {
    title: "Minority Post Matric Scholarship Gujarat",
    titleHi: "अल्पसंख्यक पोस्ट मैट्रिक छात्रवृत्ति गुजरात",
    titleGu: "લઘુમતી પોસ્ટ મેટ્રિક શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["Minority"], course: "College", state: "Gujarat", level: "State", income: 200000, amount: 12000, deadline: new Date("2025-10-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+Minority+Scholarship", description: "Gujarat state post-matric scholarship for minority students.", eligibility: "Minority domicile of Gujarat, post-matric, income ≤ ₹2 lakh.", documents: "Minority certificate, Gujarat domicile, income certificate, admission proof, Aadhaar", isActive: true
  },
  {
    title: "Dr Ambedkar Merit Scholarship Gujarat",
    titleHi: "डॉ. अंबेडकर मेरिट छात्रवृत्ति गुजरात",
    titleGu: "ડૉ. આંબેડકર મેરિટ શિષ્યવૃત્તિ ગુજરાત",
    gender: "Any", category: ["SC"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 25000, deadline: new Date("2025-12-31"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Ambedkar+Merit+Scholarship+Gujarat", description: "Merit-based scholarship for top SC students in Gujarat colleges.", eligibility: "SC Gujarat domicile, 70%+ in Class 12, income ≤ ₹6 lakh.", documents: "SC certificate, Class 12 marksheet, admission letter, income certificate, Aadhaar", isActive: true
  },
  {
    title: "Digital Gujarat Scholarship",
    titleHi: "डिजिटल गुजरात छात्रवृत्ति",
    titleGu: "ડિજિટલ ગુજરાત શિષ્યવૃત્તિ",
    gender: "Any", category: ["General", "SC", "ST", "OBC"], course: "College", state: "Gujarat", level: "State", income: 600000, amount: 15000, deadline: new Date("2025-10-31"), applyLink: "https://digitalgujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Digital+Gujarat+Scholarship", description: "Gujarat government online scholarship portal for all categories.", eligibility: "Gujarat domicile, SC/ST/OBC/EBC/Minority, college enrolled, income ≤ ₹6 lakh.", documents: "Gujarat domicile, category certificate, income certificate, marksheet, Aadhaar", isActive: true
  },
  {
    title: "Ganshaktiben Scholarship Gujarat Girls",
    titleHi: "गणशक्तिबेन छात्रवृत्ति गुजरात (छात्राएं)",
    titleGu: "ગણશક્તિબેન શિષ્યવૃત્તિ ગુજરાત (છોકરીઓ)",
    gender: "Female", category: ["General"], course: "College", state: "Gujarat", level: "State", income: 250000, amount: 10000, deadline: new Date("2025-09-30"), applyLink: "https://esamajkalyan.gujarat.gov.in", youtubeLink: "https://youtube.com/results?search_query=Gujarat+girl+scholarship+esamajkalyan", description: "Gujarat scholarship for meritorious girl students from economically weaker families.", eligibility: "Girl students, Gujarat domicile, 60%+ in last exam, income ≤ ₹2.5 lakh.", documents: "Gujarat domicile, income certificate, marksheet, Aadhaar, admission letter", isActive: true
  },
  {
    title: "Eklavya Model Residential School",
    titleHi: "एकलव्य मॉडल आवासीय विद्यालय",
    titleGu: "એકલવ્ય મૉડલ રેસિડેન્શિયલ સ્કૂલ",
    gender: "Any", category: ["ST"], course: "School", state: "Any", level: "Central", income: 999999999, amount: 50000, deadline: new Date("2026-06-30"), applyLink: "https://tribal.nic.in", youtubeLink: "https://youtube.com/results?search_query=Eklavya+Model+Residential+School", description: "Residential school for ST children, Class 6 to 12.", eligibility: "ST students, Class 6 admission via entrance test.", documents: "ST certificate, birth certificate, income certificate, Aadhaar", isActive: true
  },
  {
    title: "Tata Capital Pankh Scholarship",
    titleHi: "टाटा कैपिटल पंख छात्रवृत्ति",
    titleGu: "ટાટા કેપિટલ પાંખ શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 400000, amount: 12000, deadline: new Date("2025-07-31"), applyLink: "https://www.buddy4study.com/tata-capital-pankh-scholarship", youtubeLink: "https://youtube.com/results?search_query=Tata+Capital+Pankh+Scholarship", description: "Tata Capital scholarship for Class 11-graduation students.", eligibility: "Class 11-graduation, 60%+ marks, income ≤ ₹4 lakh.", documents: "Income certificate, marksheet, admission proof, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Sitaram Jindal Foundation Scholarship",
    titleHi: "सीताराम जिंदल फाउंडेशन छात्रवृत्ति",
    titleGu: "સીતારામ જિંદલ ફાઉન્ડેશન શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 250000, amount: 24000, deadline: new Date("2025-06-30"), applyLink: "https://sitaramjindalfoundation.org", youtubeLink: "https://youtube.com/results?search_query=Sitaram+Jindal+Foundation+Scholarship", description: "Private foundation scholarship for meritorious poor students.", eligibility: "60%+ marks, income ≤ ₹2.5 lakh.", documents: "Income certificate, marksheet, admission proof, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Vidyasaarathi Scholarship",
    titleHi: "विद्यासारथी छात्रवृत्ति",
    titleGu: "વિદ્યાસારથી શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 600000, amount: 25000, deadline: new Date("2026-06-30"), applyLink: "https://www.vidyasaarathi.co.in", youtubeLink: "https://youtube.com/results?search_query=Vidyasaarathi+Scholarship", description: "Corporate-funded scholarship portal for various courses.", eligibility: "Generally 60%+, income ≤ ₹6 lakh.", documents: "Marksheet, income certificate, admission letter, Aadhaar, bank passbook", isActive: true
  },
  {
    title: "Reliance Foundation Scholarship",
    titleHi: "रिलायंस फाउंडेशन छात्रवृत्ति",
    titleGu: "રિલાયન્સ ફાઉન્ડેશન શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 600000, amount: 400000, deadline: new Date("2026-06-30"), applyLink: "https://reliancefoundation.org/scholarships", youtubeLink: "https://youtube.com/results?search_query=Reliance+Foundation+Scholarship", description: "Reliance Foundation merit-cum-means scholarship for UG students.", eligibility: "1st year UG, 60%+ in Class 12, income ≤ ₹6 lakh.", documents: "Income certificate, Class 12 marksheet, admission letter, Aadhaar", isActive: true
  },
  {
    title: "Aditya Birla Scholarship",
    titleHi: "आदित्य बिरला छात्रवृत्ति",
    titleGu: "આદિત્ય બિરલા શિષ્યવૃત્તિ",
    gender: "Any", category: ["General"], course: "College", state: "Any", level: "Trust", income: 999999999, amount: 65000, deadline: new Date("2026-06-30"), applyLink: "https://www.adityabirlascholars.net", youtubeLink: "https://youtube.com/results?search_query=Aditya+Birla+Scholarship", description: "Prestigious merit-based scholarship for students in top colleges.", eligibility: "Admitted to select top institutions, merit-based selection.", documents: "Admission letter, Class 12 marksheet, Aadhaar, bank passbook", isActive: true
  },
];

export async function GET() {
  try {
    await connectDB();
    await Scholarship.deleteMany({});
    const result = await Scholarship.insertMany(DATA);
    return NextResponse.json({
      message: `✅ ${result.length} scholarships seeded with Hindi & Gujarati titles!`,
      count: result.length
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}