'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Mail, Phone, MapPin, User, Calendar, BookOpen } from 'lucide-react'
import { useLanguage } from "@/lib/language-context"

const brandColor = "oklch(0.50 0.16 250)"

export default function StudentProfile() {
  const { t } = useLanguage()

  const student = {
    name: "Rahul Patel",
    email: "rahulpatel@email.com",
    phone: "+91 9876543210",
    address: "Ahmedabad, Gujarat",
    dob: "15 Aug 2003",
    gender: "Male",
    caste: "OBC",
    income: "₹3,50,000 per year",
    tenth: "88%",
    twelfth: "91%",
    course: "B.Tech Computer Engineering",
    university: "Gujarat Technological University",
    year: "3rd Year",
    enrollment: "GTU2023CE001",
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold"
            style={{ color: brandColor }}
          >
            {t("studentProfileTitle")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("profileSubtitle")}
          </p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 rounded-2xl shadow-sm">
          <CardContent className="flex items-center gap-6 p-6">
            <img
              src="/placeholder-user.jpg"
              alt="Student"
              className="w-24 h-24 rounded-full border-4"
              style={{ borderColor: "oklch(0.50 0.16 250 / 0.2)" }}
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {student.name}
              </h2>
              <p className="text-muted-foreground">
                {student.course}
              </p>
              <p className="text-sm text-muted-foreground">
                {student.university}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle 
              className="text-lg font-semibold"
              style={{ color: brandColor }}
            >
              {t("personalInformation")}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6">
            <Info icon={<Mail />} label={t("emailAddress")} value={student.email} />
            <Info icon={<Phone />} label={t("phoneNumber")} value={student.phone} />
            <Info icon={<MapPin />} label={t("address")} value={student.address} />
            <Info icon={<Calendar />} label={t("dateOfBirth")} value={student.dob} />
            <Info icon={<User />} label={t("gender")} value={student.gender} />
            <Info icon={<BookOpen />} label={t("casteCategory")} value={student.caste} />
            <Info icon={<BookOpen />} label={t("annualIncome")} value={student.income} />
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card className="rounded-2xl shadow-sm mt-8">
          <CardHeader>
            <CardTitle 
              className="text-lg font-semibold"
              style={{ color: brandColor }}
            >
              {t("academicInformation")}
            </CardTitle>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 gap-6">
            <Info icon={<GraduationCap />} label={t("tenthPercentage")} value={student.tenth} />
            <Info icon={<GraduationCap />} label={t("twelfthPercentage")} value={student.twelfth} />
            <Info icon={<GraduationCap />} label={t("year")} value={student.year} />
            <Info icon={<GraduationCap />} label={t("enrollmentNumber")} value={student.enrollment} />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

function Info({ icon, label, value }: any) {
  const brandColor = "oklch(0.50 0.16 250)"

  return (
    <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm transition bg-card">
      <div 
        className="p-3 rounded-lg"
        style={{ backgroundColor: "oklch(0.50 0.16 250 / 0.1)", color: brandColor }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}