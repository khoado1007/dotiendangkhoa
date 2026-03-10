# webAI_Assistant_student_IT
# dotiendangkhoa
# dotiendangkhoa
# dotiendangkhoa
@startuml
' hide the spot
hide circle

' avoid problems with angled crows feet
skinparam linetype ortho

entity "User" as user {
  + username: String
  + email: String
  + password: String
  + googleId: String
  + role: String
  + isProfileComplete: Boolean
}

entity "Student" as student {
  + fullName: String
  + dob: Date
  + enrollmentYear: Number
  + schoolName: String
  + majorName: String
}

entity "University" as university {
  + name: String
  + code: String
}

entity "Major" as major {
  + name: String
  + facultyName: String
}

entity "Subject" as subject {
  + name: String
  + semester: Number
}

entity "Semester" as semester {
  + semester1_start: String
  + semester1_end: String
  ...
}

entity "Timetable" as timetable {
  + semester: String
  + dayOfWeek: String
  + session: String
  + subjectName: String
  ...
}

entity "Roadmap" as roadmap {
  + semester: String
  + subjectName: String
  + todos: Array
}

entity "Exercise" as exercise {
  + subjectName: String
  + topicText: String
  + mode: String
  + data: Object
  + materials: Object
}

' Relationships
user "1" -- "1" student : "has profile"
user "1" -- "1" semester : "configures"
user "1" -- "0..*" timetable : "has"
user "1" -- "0..*" roadmap : "follows"

university "1" -- "0..*" major : "contains"
major "1" -- "0..*" subject : "contains"
student "1" -- "1" major : "studies"

roadmap "1" -- "0..*" exercise : "leads to"
timetable "1" -- "0..*" subject : "schedules"


@enduml