// ============================================================
// SEED: LISTENING — Placement Test
// 4 passages × 3 câu = 12 câu
// Compatible with Prisma
// ============================================================

const listeningPassages = [
  {
    skill: "listening",
    title: "Hotel Room Booking",
    content: `RECEPTIONIST: Good afternoon, Bluewater Hotel. How may I help you?
CALLER: Hello. I'd like to make a reservation for next month, please.
RECEPTIONIST: Of course. What dates were you looking at?
CALLER: From the twelfth to the fifteenth of August — so three nights.
RECEPTIONIST: Let me check availability... Yes, we have rooms available. What type of room would you prefer? We have standard doubles at eighty-nine pounds per night, or superior doubles at one hundred and fifteen pounds per night. The superior rooms have a sea view and a king-size bed.
CALLER: I think the standard double would be fine, thank you. Does that include breakfast?
RECEPTIONIST: Standard rooms include continental breakfast. If you'd like a full cooked breakfast, that's an extra eight pounds per person per day.
CALLER: Continental is fine. Is there free parking at the hotel?
RECEPTIONIST: Yes, we have a car park on site — it's complimentary for guests. You'll need to register your vehicle at check-in.
CALLER: Perfect. Could I book now?
RECEPTIONIST: Certainly. Could I take your name, please?
CALLER: It's Graham. David Graham. G-R-A-H-A-M.
RECEPTIONIST: And a contact phone number?
CALLER: Zero seven seven — four five two — eight eight one three.
RECEPTIONIST: Thank you, Mr Graham. I've booked you in for the twelfth to the fifteenth of August, standard double with continental breakfast. Check-in is from three o'clock, and check-out by eleven in the morning. Is there anything else?
CALLER: No, that's everything. Thank you.`,
    bandMin: 3.5,
    bandMax: 4.5,
    topicTags: ["travel", "daily_life"],
    sectionType: 1,
    audioUrl: null,
    audioDurationSec: 110,
    accentType: "british",
    ttsGenerated: false,
    isAiGenerated: false,
    status: "approved",
  },
  {
    skill: "listening",
    title: "University Library Registration",
    content: `LIBRARIAN: Hello, welcome to the university library. Are you a new student?
STUDENT: Yes, I just started this semester. I need to register for a library card.
LIBRARIAN: No problem. I'll need a few details. Can I start with your full name?
STUDENT: Sure — it's Omar Al-Rashidi. O-M-A-R. Al-Rashidi: A-L, hyphen, R-A-S-H-I-D-I.
LIBRARIAN: Thank you. And your student ID number?
STUDENT: It's two zero two four, dash, zero seven, dash, three four eight.
LIBRARIAN: Great. Which faculty are you in?
STUDENT: Engineering. Specifically, Civil Engineering.
LIBRARIAN: And are you an undergraduate or postgraduate?
STUDENT: Postgraduate — I'm doing a Master's.
LIBRARIAN: Right. Postgraduate students can borrow up to fifteen books at a time, compared to eight for undergraduates. The loan period is four weeks, with one renewal allowed online through your student portal.
STUDENT: Can I access journals and databases from home?
LIBRARIAN: Yes. You'll use your student email and the password you set for the university portal. The library website has a full list of databases we subscribe to — over two hundred academic databases including Scopus and Web of Science.
STUDENT: That's great. What are the library's opening hours?
LIBRARIAN: During term time, we're open Monday to Friday from eight a.m. to ten p.m., and weekends from nine to six. During examination periods we extend to midnight on weekdays.
STUDENT: Perfect. Is there a quiet study area?
LIBRARIAN: The entire second floor is a silent study zone. We also have six group study rooms on the ground floor — these can be booked up to three days in advance online.`,
    bandMin: 4.5,
    bandMax: 5.5,
    topicTags: ["education", "academic"],
    sectionType: 1,
    audioUrl: null,
    audioDurationSec: 130,
    accentType: "british",
    ttsGenerated: false,
    isAiGenerated: false,
    status: "approved",
  },
  {
    skill: "listening",
    title: "Community Recycling Centre Orientation",
    content: `Good morning, everyone, and welcome to the Greenfield Community Recycling Centre. I'm going to give you a brief overview of how our facility works and what we accept here.

First, a bit of background. The centre opened in two thousand and fourteen and processes around four hundred tonnes of waste per month. We work with twelve local councils and have diverted over eighty percent of the waste we receive away from landfill — which we're very proud of.

Now, let me explain the layout. As you enter the main gate, you'll see a large covered area directly ahead — that's the sorting hall, where all incoming waste is separated. To your left is the composting zone, which handles garden waste and food scraps. To your right are the container bays, organised by material type.

In terms of what we accept: we take glass, paper and cardboard, metals — including cans and scrap metal — and most plastics marked with recycling symbols one through seven. We also have a dedicated area for electrical items — things like old toasters, kettles, and small appliances. Please note we do not accept televisions or large white goods such as washing machines here — these need to go to our sister facility on the Parkway Industrial Estate.

We accept drop-offs seven days a week between seven in the morning and six in the evening. You don't need an appointment for most items, but for large quantities of construction waste — things like rubble or timber — you'll need to book in advance by calling our main office number, which is printed on the leaflet you were given at the entrance.

One important rule: please do not leave items outside the gate when the centre is closed. Fly-tipping is illegal and undermines the whole purpose of what we do here.

Any questions so far?`,
    bandMin: 5.0,
    bandMax: 6.0,
    topicTags: ["environment", "daily_life"],
    sectionType: 2,
    audioUrl: null,
    audioDurationSec: 155,
    accentType: "british",
    ttsGenerated: false,
    isAiGenerated: false,
    status: "approved",
  },
  {
    skill: "listening",
    title: "Seminar Discussion: Remote Work and Productivity",
    content: `TUTOR: Let's start with what you found in the research. Tom, you were looking at productivity metrics — what did the literature say?

TOM: So the findings are actually quite mixed. Some studies show productivity gains for individual tasks — things that require concentration and minimal collaboration. But team-based work seems to suffer. One meta-analysis from Stanford found that remote workers completed tasks about thirteen percent faster, but this was mainly for call-centre type roles — highly structured, individual work.

TUTOR: That's an important caveat. Priya, you were looking at the wellbeing side?

PRIYA: Yes. The picture is similarly complicated. Remote work does reduce commuting stress, which has a measurable positive effect on reported wellbeing. But sustained remote work — over twelve months — correlates with increased rates of loneliness and what researchers call 'always-on' culture, where employees feel unable to properly disconnect.

TOM: There's also a significant equity issue. The research I looked at showed that junior employees and those from lower socioeconomic backgrounds benefit less from remote work — they're more likely to have inadequate home working conditions, and they miss out on the informal mentoring that happens naturally in an office.

TUTOR: That's a point that's often missed in the policy debate. So when we're thinking about your recommendations for the assignment — should organisations adopt hybrid models, fully remote, or return to office?

PRIYA: I think the evidence points towards hybrid as the optimal model for most organisations. You get the focused work benefits of remote while preserving the collaboration and social capital benefits of in-person work.

TOM: I'd agree, though I'd add that hybrid only works if organisations redesign how they use office time deliberately — just requiring people to be present two days a week without restructuring how meetings and collaboration work doesn't actually solve the problems.

TUTOR: Good point. That's the implementation question that a lot of the current research is focusing on.`,
    bandMin: 6.0,
    bandMax: 7.5,
    topicTags: ["work", "technology", "academic"],
    sectionType: 3,
    audioUrl: null,
    audioDurationSec: 185,
    accentType: "british",
    ttsGenerated: false,
    isAiGenerated: false,
    status: "approved",
  },
];

const listeningQuestions = [
  // Passage 1: Hotel Room Booking
  {
    skill: "listening",
    subSkillCode: "form_completion",
    questionType: "mcq",
    questionText: "[AUDIO] Hotel Room Booking\n\nHow much does a standard double room cost per night?",
    options: ["A. £79", "B. £89", "C. £99", "D. £115"],
    correctAnswer: "B",
    explanation: 'Receptionist: "standard doubles at eighty-nine pounds per night".',
    passageTitle: "Hotel Room Booking",
    questionOrder: 1,
    contextType: "audio",
    bandMin: 3.5,
    bandMax: 4.5,
    difficultyWeight: 1.0,
    expectedTimeSec: 75,
    errorTag: "form_completion",
    topicTags: ["travel"],
    status: "approved",
    irtA: 1.0,
    irtB: -2.5,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "form_completion",
    questionType: "mcq",
    questionText: "[AUDIO] Hotel Room Booking\n\nWhat does the standard double room include as standard?",
    options: ["A. Full cooked breakfast", "B. Continental breakfast", "C. No breakfast", "D. Dinner and breakfast"],
    correctAnswer: "B",
    explanation: 'Receptionist: "Standard rooms include continental breakfast."',
    passageTitle: "Hotel Room Booking",
    questionOrder: 2,
    contextType: "audio",
    bandMin: 3.5,
    bandMax: 4.5,
    difficultyWeight: 1.0,
    expectedTimeSec: 70,
    errorTag: "form_completion",
    topicTags: ["travel"],
    status: "approved",
    irtA: 1.0,
    irtB: -2.5,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "mcq",
    questionType: "mcq",
    questionText: "[AUDIO] Hotel Room Booking\n\nWhat must the guest do regarding their car when they arrive at the hotel?",
    options: ["A. Pay a daily parking fee", "B. Park on the street outside", "C. Register their vehicle at check-in", "D. Book parking in advance online"],
    correctAnswer: "C",
    explanation: "Receptionist: \"You'll need to register your vehicle at check-in.\" Parking itself is free.",
    passageTitle: "Hotel Room Booking",
    questionOrder: 3,
    contextType: "audio",
    bandMin: 4.0,
    bandMax: 5.0,
    difficultyWeight: 1.2,
    expectedTimeSec: 70,
    errorTag: "mcq",
    topicTags: ["travel"],
    status: "approved",
    irtA: 1.2,
    irtB: -1.91,
    irtC: 0.25,
    isPlacement: true,
  },
  // Passage 2: University Library Registration
  {
    skill: "listening",
    subSkillCode: "form_completion",
    questionType: "mcq",
    questionText: "[AUDIO] University Library Registration\n\nHow many books can a postgraduate student borrow at one time?",
    options: ["A. 8", "B. 10", "C. 12", "D. 15"],
    correctAnswer: "D",
    explanation: 'Librarian: "Postgraduate students can borrow up to fifteen books at a time."',
    passageTitle: "University Library Registration",
    questionOrder: 1,
    contextType: "audio",
    bandMin: 4.5,
    bandMax: 5.5,
    difficultyWeight: 1.3,
    expectedTimeSec: 70,
    errorTag: "form_completion",
    topicTags: ["education"],
    status: "approved",
    irtA: 1.3,
    irtB: -1.36,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "note_completion",
    questionType: "mcq",
    questionText: "[AUDIO] University Library Registration\n\nUntil what time is the library open on weekday evenings during term time?",
    options: ["A. 9 p.m.", "B. 10 p.m.", "C. 11 p.m.", "D. Midnight"],
    correctAnswer: "B",
    explanation: 'Librarian: "Monday to Friday from eight a.m. to ten p.m." Midnight is only during exam periods.',
    passageTitle: "University Library Registration",
    questionOrder: 2,
    contextType: "audio",
    bandMin: 4.5,
    bandMax: 5.5,
    difficultyWeight: 1.3,
    expectedTimeSec: 65,
    errorTag: "note_completion",
    topicTags: ["education"],
    status: "approved",
    irtA: 1.3,
    irtB: -1.36,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "mcq",
    questionType: "mcq",
    questionText: "[AUDIO] University Library Registration\n\nHow far in advance can group study rooms be booked?",
    options: ["A. Same day only", "B. Up to two days in advance", "C. Up to three days in advance", "D. Up to one week in advance"],
    correctAnswer: "C",
    explanation: 'Librarian: "these can be booked up to three days in advance online."',
    passageTitle: "University Library Registration",
    questionOrder: 3,
    contextType: "audio",
    bandMin: 5.0,
    bandMax: 6.0,
    difficultyWeight: 1.4,
    expectedTimeSec: 65,
    errorTag: "mcq",
    topicTags: ["education"],
    status: "approved",
    irtA: 1.4,
    irtB: -0.82,
    irtC: 0.25,
    isPlacement: true,
  },
  // Passage 3: Community Recycling Centre Orientation
  {
    skill: "listening",
    subSkillCode: "note_completion",
    questionType: "mcq",
    questionText: "[AUDIO] Community Recycling Centre Orientation\n\nWhat percentage of waste received by the centre has been diverted from landfill?",
    options: ["A. Over 70%", "B. Over 75%", "C. Over 80%", "D. Over 90%"],
    correctAnswer: "C",
    explanation: 'Guide: "we have diverted over eighty percent of the waste we receive away from landfill."',
    passageTitle: "Community Recycling Centre Orientation",
    questionOrder: 1,
    contextType: "audio",
    bandMin: 5.0,
    bandMax: 5.5,
    difficultyWeight: 1.3,
    expectedTimeSec: 65,
    errorTag: "note_completion",
    topicTags: ["environment"],
    status: "approved",
    irtA: 1.3,
    irtB: -1.36,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "mcq",
    questionType: "mcq",
    questionText: "[AUDIO] Community Recycling Centre Orientation\n\nWhich item is NOT accepted at this recycling centre?",
    options: ["A. Glass bottles", "B. Old kettles", "C. Scrap metal", "D. Washing machines"],
    correctAnswer: "D",
    explanation: 'Guide: "we do not accept televisions or large white goods such as washing machines here." Kettles and appliances are accepted in the electrical items area.',
    passageTitle: "Community Recycling Centre Orientation",
    questionOrder: 2,
    contextType: "audio",
    bandMin: 5.5,
    bandMax: 6.0,
    difficultyWeight: 1.5,
    expectedTimeSec: 65,
    errorTag: "mcq",
    topicTags: ["environment"],
    status: "approved",
    irtA: 1.5,
    irtB: -0.55,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "mcq",
    questionType: "mcq",
    questionText: "[AUDIO] Community Recycling Centre Orientation\n\nWhen must visitors make an appointment before coming to the centre?",
    options: ["A. For all drop-offs at any time", "B. For drop-offs on weekends only", "C. For large quantities of construction waste", "D. For electrical items only"],
    correctAnswer: "C",
    explanation: 'Guide: "for large quantities of construction waste — things like rubble or timber — you\'ll need to book in advance."',
    passageTitle: "Community Recycling Centre Orientation",
    questionOrder: 3,
    contextType: "audio",
    bandMin: 5.5,
    bandMax: 6.5,
    difficultyWeight: 1.6,
    expectedTimeSec: 60,
    errorTag: "mcq",
    topicTags: ["environment"],
    status: "approved",
    irtA: 1.6,
    irtB: -0.27,
    irtC: 0.25,
    isPlacement: true,
  },
  // Passage 4: Seminar Discussion: Remote Work
  {
    skill: "listening",
    subSkillCode: "mcq",
    questionType: "mcq",
    questionText: "[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nAccording to Tom, which type of work showed a 13% productivity increase for remote workers?",
    options: ["A. Creative and design work", "B. Structured, individual tasks like call-centre roles", "C. Team-based project work", "D. Management and leadership roles"],
    correctAnswer: "B",
    explanation: 'Tom: "this was mainly for call-centre type roles — highly structured, individual work."',
    passageTitle: "Seminar Discussion: Remote Work and Productivity",
    questionOrder: 1,
    contextType: "audio",
    bandMin: 6.0,
    bandMax: 7.0,
    difficultyWeight: 1.7,
    expectedTimeSec: 60,
    errorTag: "mcq",
    topicTags: ["work", "technology"],
    status: "approved",
    irtA: 1.7,
    irtB: 0.27,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "attitude_detection",
    questionType: "mcq",
    questionText: "[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nWhat equity concern does Tom raise about remote work?",
    options: ["A. Senior employees are disadvantaged by remote work arrangements", "B. Junior employees and those from lower socioeconomic backgrounds benefit less", "C. Remote work benefits only those in the technology sector", "D. Older employees are less productive when working remotely"],
    correctAnswer: "B",
    explanation: 'Tom: "junior employees and those from lower socioeconomic backgrounds benefit less from remote work — they\'re more likely to have inadequate home working conditions, and they miss out on informal mentoring."',
    passageTitle: "Seminar Discussion: Remote Work and Productivity",
    questionOrder: 2,
    contextType: "audio",
    bandMin: 6.5,
    bandMax: 7.5,
    difficultyWeight: 1.8,
    expectedTimeSec: 55,
    errorTag: "attitude_detection",
    topicTags: ["work"],
    status: "approved",
    irtA: 1.8,
    irtB: 0.55,
    irtC: 0.25,
    isPlacement: true,
  },
  {
    skill: "listening",
    subSkillCode: "attitude_detection",
    questionType: "mcq",
    questionText: "[AUDIO] Seminar Discussion: Remote Work and Productivity\n\nWhat condition does Tom set for hybrid working to be effective?",
    options: ["A. Employees must be in the office at least three days per week", "B. Organisations must provide home office equipment to all staff", "C. Organisations must deliberately redesign how they use in-office time", "D. Remote work should only be offered to senior staff"],
    correctAnswer: "C",
    explanation: "Tom: \"hybrid only works if organisations redesign how they use office time deliberately — just requiring people to be present two days a week without restructuring how meetings and collaboration work doesn't actually solve the problems.\"",
    passageTitle: "Seminar Discussion: Remote Work and Productivity",
    questionOrder: 3,
    contextType: "audio",
    bandMin: 7.0,
    bandMax: 7.5,
    difficultyWeight: 1.9,
    expectedTimeSec: 55,
    errorTag: "attitude_detection",
    topicTags: ["work", "academic"],
    status: "approved",
    irtA: 1.9,
    irtB: 0.82,
    irtC: 0.25,
    isPlacement: true,
  },
];

module.exports = { listeningPassages, listeningQuestions };
