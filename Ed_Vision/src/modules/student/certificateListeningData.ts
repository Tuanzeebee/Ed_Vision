/**
 * certificateListeningData.ts
 *
 * Static dialogue database for listening practice.
 * Each "dialogue pack" belongs to a topic key (matching certificateData.tsx topicKey).
 *
 * Flow:
 *   topicKey → DialoguePack[] → random pick → fill template → TTS → play + MCQ
 *
 * TTS: Microsoft Edge TTS via the free `edge-tts` REST proxy we call at:
 *   /api/tts?text=...&voice=en-US-JennyNeural   (female)
 *   /api/tts?text=...&voice=en-US-GuyNeural      (male)
 *
 * If no backend is available the component falls back to the browser's
 * built-in Web Speech API (SpeechSynthesis).
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DialogueLine {
  speaker: 'A' | 'B'          // A = female (Jenny), B = male (Guy)
  text: string
}

export interface ListeningQuestion {
  question: string
  options: [string, string, string]   // always 3 options
  answer: 0 | 1 | 2                   // index of correct option
  explanation: string
  tip: string
}

export interface DialoguePack {
  id: string
  theme: string                        // human-readable category shown in UI
  difficulty: 'easy' | 'medium' | 'hard'
  dialogue: DialogueLine[]
  question: ListeningQuestion
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/** Build the full plain-text script read by TTS (speaker labels stripped). */
export function buildAudioScript(lines: DialogueLine[]): string {
  return lines.map(l => l.text).join('  ')
}

/** Build the annotated script shown to user AFTER answering. */
export function buildAnnotatedScript(lines: DialogueLine[]): string {
  return lines
    .map(l => `${l.speaker === 'A' ? 'Woman' : 'Man'}: ${l.text}`)
    .join('\n')
}

// ─── TTS URL builder ───────────────────────────────────────────────────────────
// Calls our NestJS backend. If backend unavailable, falls back to Web Speech.

export const TTS_FEMALE_VOICE = 'en-US-JennyNeural'
export const TTS_MALE_VOICE   = 'en-US-GuyNeural'

export function buildTtsUrl(text: string): string {
  const encoded = encodeURIComponent(text)
  // Backend route: GET /api/tts?text=...
  return `/api/tts?text=${encoded}`
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOGUE PACKS
// Keys mirror the topicKey values in certificateData.tsx
// ─────────────────────────────────────────────────────────────────────────────

// ══════════════════════════════════════════════════════════════════════════════
// listening.part1_photos  — TOEIC Part 1 (Photo descriptions)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART1_PHOTOS: DialoguePack[] = [
  {
    id: 'p1_01',
    theme: 'Office Scene',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'A woman is typing on a computer at her desk.' },
    ],
    question: {
      question: 'What is the woman doing in the picture?',
      options: ['She is typing on a computer.', 'She is talking on the phone.', 'She is writing in a notebook.'],
      answer: 0,
      explanation: 'The correct answer is A. The audio says "A woman is typing on a computer at her desk."',
      tip: 'In Part 1, focus on the main action (verb) and the subject. Eliminate options with wrong actions first.',
    },
  },
  {
    id: 'p1_02',
    theme: 'Meeting Room',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'B', text: 'Several people are seated around a conference table.' },
    ],
    question: {
      question: 'Where are the people sitting?',
      options: ['In a cafeteria', 'Around a conference table', 'In a waiting room'],
      answer: 1,
      explanation: 'The audio says "around a conference table," which matches option B.',
      tip: 'Watch out for location traps — cafeteria and waiting room both involve chairs but are different settings.',
    },
  },
  {
    id: 'p1_03',
    theme: 'Outdoors',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'A man is carrying boxes near a delivery truck.' },
    ],
    question: {
      question: 'What is the man doing?',
      options: ['Driving a truck', 'Loading a van', 'Carrying boxes near a truck'],
      answer: 2,
      explanation: '"Carrying boxes near a delivery truck" matches option C exactly.',
      tip: 'Beware of options that use related words (van ≠ truck, loading ≠ carrying).',
    },
  },
  {
    id: 'p1_04',
    theme: 'Restaurant',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'B', text: 'Chairs are stacked next to a table in the restaurant.' },
    ],
    question: {
      question: 'What is shown in the picture?',
      options: ['People are eating at a table.', 'Chairs are stacked next to a table.', 'A waiter is serving food.'],
      answer: 1,
      explanation: 'The audio describes stacked chairs, not people eating or a waiter.',
      tip: 'Part 1 often shows static arrangements of objects. Do not assume people are present if the audio says nothing about people.',
    },
  },
  {
    id: 'p1_05',
    theme: 'Street',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Pedestrians are crossing the street at an intersection.' },
    ],
    question: {
      question: 'What are the pedestrians doing?',
      options: ['Waiting for a bus', 'Crossing the street', 'Standing on the sidewalk'],
      answer: 1,
      explanation: '"Crossing the street at an intersection" = option B.',
      tip: 'All three options involve pedestrians near roads. Focus on the verb: crossing vs. waiting vs. standing.',
    },
  },
  {
    id: 'p1_06',
    theme: 'Kitchen',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'A cook is arranging dishes on a shelf in the kitchen.' },
    ],
    question: {
      question: 'What is the cook doing?',
      options: ['Washing dishes', 'Cooking on a stove', 'Arranging dishes on a shelf'],
      answer: 2,
      explanation: 'The audio says "arranging dishes on a shelf," which is option C.',
      tip: 'In kitchen scenes, listen carefully to what the person is doing with the objects (washing vs. arranging vs. cooking).',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.part2_q_r  — TOEIC Part 2 (Question-Response)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART2_QR: DialoguePack[] = [
  {
    id: 'p2_01',
    theme: 'Time & Schedule',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'When does the meeting start?' },
      { speaker: 'B', text: 'At two o\'clock this afternoon.' },
    ],
    question: {
      question: 'What time does the meeting start?',
      options: ['In the morning', 'At two o\'clock this afternoon', 'Tomorrow'],
      answer: 1,
      explanation: 'The man directly answers "at two o\'clock this afternoon."',
      tip: 'When questions in Part 2 always look for a time or schedule answer. Ignore options that answer "how" or "who."',
    },
  },
  {
    id: 'p2_02',
    theme: 'Location',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'B', text: 'Where is the printer?' },
      { speaker: 'A', text: 'It\'s on the second floor, near the copy room.' },
    ],
    question: {
      question: 'Where is the printer?',
      options: ['In the reception area', 'On the second floor, near the copy room', 'In the manager\'s office'],
      answer: 1,
      explanation: 'The woman says it\'s on the second floor near the copy room.',
      tip: 'Where questions need a location answer. Beware of distractor options that mention real office locations.',
    },
  },
  {
    id: 'p2_03',
    theme: 'Suggestions',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Why don\'t we order lunch from the Italian place?' },
      { speaker: 'B', text: 'Sure, that sounds great.' },
    ],
    question: {
      question: 'What does the man suggest?',
      options: ['Going out for lunch', 'Ordering lunch from the Italian place', 'Skipping lunch today'],
      answer: 1,
      explanation: '"Why don\'t we order lunch from the Italian place?" is a suggestion. B agrees.',
      tip: '"Why don\'t we…" is a common suggestion structure in Part 2. The response "Sure / That sounds great" signals agreement.',
    },
  },
  {
    id: 'p2_04',
    theme: 'Requests',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'Could you email me the report by Friday?' },
      { speaker: 'A', text: 'No problem, I\'ll send it tomorrow.' },
    ],
    question: {
      question: 'What does the woman agree to do?',
      options: ['Print the report', 'Email the report by tomorrow', 'Meet on Friday'],
      answer: 1,
      explanation: 'She says "I\'ll send it tomorrow" meaning the report will be emailed before Friday.',
      tip: 'Notice the woman commits to sending it TOMORROW, not on Friday. Part 2 often tests whether you catch subtle time differences.',
    },
  },
  {
    id: 'p2_05',
    theme: 'Negative Question',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'Haven\'t you submitted the project proposal yet?' },
      { speaker: 'B', text: 'I was waiting for the client\'s feedback first.' },
    ],
    question: {
      question: 'Why hasn\'t the man submitted the proposal?',
      options: ['He forgot about it.', 'He was waiting for client feedback.', 'The deadline was extended.'],
      answer: 1,
      explanation: 'The man explains he was waiting for the client\'s feedback.',
      tip: 'Negative questions ("Haven\'t you…?") are tricky. Focus on the response, not the question structure.',
    },
  },
  {
    id: 'p2_06',
    theme: 'Indirect Response',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'Is Mr. Kim attending the conference next week?' },
      { speaker: 'A', text: 'He just got back from a business trip — you might want to check with him directly.' },
    ],
    question: {
      question: 'What does the woman imply?',
      options: ['Mr. Kim is definitely going.', 'She does not know if Mr. Kim is attending.', 'Mr. Kim cannot attend.'],
      answer: 1,
      explanation: 'The woman doesn\'t give a direct yes/no answer — she suggests checking with Mr. Kim, implying she doesn\'t know.',
      tip: 'Indirect responses that say "you should ask someone else" or "I\'m not sure" are common in Part 2 hard questions.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.part3_short  — TOEIC Part 3 (Short Conversations)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART3_SHORT: DialoguePack[] = [
  {
    id: 'p3_01',
    theme: 'Office Supplies',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'Excuse me, do we have any extra printer cartridges in the supply room?' },
      { speaker: 'B', text: 'I checked this morning, and we\'re actually out. I was going to place an order today.' },
      { speaker: 'A', text: 'Great. Could you also add some copy paper to the order?' },
      { speaker: 'B', text: 'Sure, I\'ll include that.' },
    ],
    question: {
      question: 'What will the man most likely do next?',
      options: ['Go to the supply room', 'Place an order for supplies', 'Ask a manager for approval'],
      answer: 1,
      explanation: 'The man says "I was going to place an order today" and agrees to add copy paper.',
      tip: 'Part 3 "what will they do next?" questions often appear in the last exchange. Focus on the final lines.',
    },
  },
  {
    id: 'p3_02',
    theme: 'Client Meeting',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'I heard the Henderson account meeting is tomorrow morning. Are you ready?' },
      { speaker: 'A', text: 'Almost. I still need to finalize the sales figures for the presentation.' },
      { speaker: 'B', text: 'Do you need help with that? I can pull the data from last quarter.' },
      { speaker: 'A', text: 'That would be really helpful, thank you.' },
    ],
    question: {
      question: 'What does the woman still need to do before the meeting?',
      options: ['Book a conference room', 'Finalize the sales figures', 'Contact the client'],
      answer: 1,
      explanation: 'The woman says she needs to "finalize the sales figures for the presentation."',
      tip: 'What someone "still needs to do" is signaled by phrases like "I still need to…" or "I haven\'t…yet."',
    },
  },
  {
    id: 'p3_03',
    theme: 'Business Travel',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'My flight to Chicago got cancelled due to the storm. What should I do?' },
      { speaker: 'B', text: 'You should call the airline first and ask to be rebooked on the next available flight.' },
      { speaker: 'A', text: 'What if there are no flights today?' },
      { speaker: 'B', text: 'Then request a full refund and we\'ll book you a train ticket instead.' },
    ],
    question: {
      question: 'What does the man suggest the woman do first?',
      options: ['Book a train ticket', 'Call the airline', 'Contact the hotel'],
      answer: 1,
      explanation: 'The man says "You should call the airline first."',
      tip: '"What should she do FIRST?" — look for sequence words: first, then, after that.',
    },
  },
  {
    id: 'p3_04',
    theme: 'Overtime Work',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'Are you planning to stay late tonight to finish the budget report?' },
      { speaker: 'A', text: 'I\'d rather not — I have a dinner reservation at seven. Can we submit it tomorrow morning?' },
      { speaker: 'B', text: 'I\'m afraid the deadline is midnight tonight. Mr. Park specifically mentioned that.' },
      { speaker: 'A', text: 'Then I\'ll have to cancel my reservation. I\'ll start working on it now.' },
    ],
    question: {
      question: 'Why does the woman decide to stay late?',
      options: ['She wants to impress Mr. Park.', 'The deadline for the report is tonight.', 'The dinner reservation was cancelled.'],
      answer: 1,
      explanation: 'The man reminds her that "the deadline is midnight tonight," so she decides to cancel her reservation and work.',
      tip: 'The reason for a decision often follows words like "because," "since," "I\'m afraid," or "Mr. X mentioned that."',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.part4_short  — TOEIC Part 4 (Monologues)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART4_SHORT: DialoguePack[] = [
  {
    id: 'p4_01',
    theme: 'Office Announcement',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'Attention all staff. The elevator in the east wing will be out of service this Friday for routine maintenance. Please use the stairwells or the elevators in the west wing. We apologize for any inconvenience.' },
    ],
    question: {
      question: 'What will happen this Friday?',
      options: ['A new elevator will be installed.', 'The east wing elevator will be shut down for maintenance.', 'Staff must use only the stairs.'],
      answer: 1,
      explanation: '"Out of service this Friday for routine maintenance" = the east wing elevator will be shut down.',
      tip: 'Announcements often give one key piece of news + alternative instructions. Identify: WHAT + WHEN + ALTERNATIVE.',
    },
  },
  {
    id: 'p4_02',
    theme: 'Voicemail',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'Hello, this message is for Sarah Kim. This is David from Greenfield Tech. I\'m calling to confirm your interview this Thursday at ten a.m. Please bring two copies of your resume and a photo ID. Call us back at 555-0192 if you need to reschedule. Thank you.' },
    ],
    question: {
      question: 'What should Sarah bring to her interview?',
      options: ['A cover letter and ID', 'Two copies of her resume and a photo ID', 'Her transcript and references'],
      answer: 1,
      explanation: 'David says "bring two copies of your resume and a photo ID."',
      tip: 'Voicemail messages list instructions. After playing the audio, the question often tests a specific item in a list.',
    },
  },
  {
    id: 'p4_03',
    theme: 'Radio Advertisement',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Looking for a new car? Visit Riverside Motors this weekend for our annual clearance sale. Get up to thirty percent off on all selected models. Financing options are available with zero down payment. Visit us at 450 Riverside Drive or call 555-0234.' },
    ],
    question: {
      question: 'What is the advertisement promoting?',
      options: ['A car rental service', 'A car dealership sale', 'A car repair center'],
      answer: 1,
      explanation: '"Annual clearance sale" at "Riverside Motors" — this is a car dealership selling cars.',
      tip: 'Advertisements follow a pattern: Problem → Solution → Call to action. Identify what is being sold.',
    },
  },
  {
    id: 'p4_04',
    theme: 'Tour Guide',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'Welcome to the Millbrook Science Museum. Before we begin our tour, I\'d like to remind everyone that photography is permitted in all exhibits except the temporary gallery on the third floor. Also, the gift shop closes at five p.m., thirty minutes before the museum itself. Please follow me to the main hall where we will start.' },
    ],
    question: {
      question: 'Where is photography NOT allowed?',
      options: ['In the main hall', 'In the temporary gallery on the third floor', 'In the gift shop'],
      answer: 1,
      explanation: '"Photography is permitted in all exhibits EXCEPT the temporary gallery on the third floor."',
      tip: '"Except" signals a negative constraint. In Part 4, test-makers specifically ask about exceptions.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.part3_graphics  — TOEIC Part 3 with Graphics
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART3_GRAPHICS: DialoguePack[] = [
  {
    id: 'p3g_01',
    theme: 'Meeting Schedule',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Have you seen the updated project schedule? The design review has been moved.' },
      { speaker: 'B', text: 'Yes, I noticed. It\'s now on Wednesday instead of Thursday.' },
      { speaker: 'A', text: 'Right. And the client presentation is still on Friday, correct?' },
      { speaker: 'B', text: 'That\'s correct, three p.m. sharp.' },
    ],
    question: {
      question: 'According to the conversation, when is the design review now scheduled?',
      options: ['Monday', 'Wednesday', 'Thursday'],
      answer: 1,
      explanation: 'The man says the design review "is now on Wednesday instead of Thursday."',
      tip: 'With graphics questions, the audio often says a change has been made. Focus on "instead of," "moved to," "now on."',
    },
  },
  {
    id: 'p3g_02',
    theme: 'Price List',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'I\'d like to order the deluxe package, but I noticed the website shows a different price than what the catalog says.' },
      { speaker: 'A', text: 'You\'re right. The catalog price is outdated. The current price is one hundred twenty dollars, which is what\'s on our website.' },
      { speaker: 'B', text: 'Alright, I\'ll go with the website price then.' },
      { speaker: 'A', text: 'Great. Would you like to pay by card or bank transfer?' },
    ],
    question: {
      question: 'How much will the man pay for the deluxe package?',
      options: ['$99', '$110', '$120'],
      answer: 2,
      explanation: 'The woman says "the current price is one hundred twenty dollars."',
      tip: 'Price graphics questions: the audio says which price is correct. Ignore the outdated number.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.part4_varied  — TOEIC Part 4 varied monologues
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PART4_VARIED: DialoguePack[] = [
  {
    id: 'p4v_01',
    theme: 'Meeting Opening',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Good morning, everyone. Thank you for joining today\'s quarterly review. We\'ll start with the sales figures from the Northeast region, followed by an update from Marketing, and then open the floor for questions. Please hold all questions until the end. We should be done by noon.' },
    ],
    question: {
      question: 'What will be discussed FIRST in the meeting?',
      options: ['Marketing updates', 'Sales figures from the Northeast', 'Questions from attendees'],
      answer: 1,
      explanation: '"We\'ll start with the sales figures from the Northeast region."',
      tip: 'Meeting opening monologues follow an agenda. Listen for sequence: first / followed by / then / finally.',
    },
  },
  {
    id: 'p4v_02',
    theme: 'Company News',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'I\'m pleased to announce that our company has been awarded the Regional Employer of the Year award for the second consecutive year. This recognition reflects the hard work of every employee. As a token of our appreciation, all staff will receive an additional paid day off this quarter. Details will be sent by HR by end of week.' },
    ],
    question: {
      question: 'What will employees receive as a reward?',
      options: ['A salary bonus', 'An extra paid day off', 'A company dinner'],
      answer: 1,
      explanation: '"All staff will receive an additional paid day off this quarter."',
      tip: 'Reward announcements: focus on WHAT employees will get (pay, time off, event, voucher).',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.implication  — TOEIC Part 3&4 Implied Meaning
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_IMPLICATION: DialoguePack[] = [
  {
    id: 'imp_01',
    theme: 'Complaint',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'I noticed the same software bug has been reported three times this month.' },
      { speaker: 'B', text: 'I know. The development team said they\'d look into it after the product launch.' },
      { speaker: 'A', text: 'That\'s what they said last month too.' },
      { speaker: 'B', text: 'I understand your frustration. I\'ll escalate this to the project manager today.' },
    ],
    question: {
      question: 'What does the woman imply when she says "That\'s what they said last month too"?',
      options: ['She is satisfied with the team\'s response.', 'She doubts the development team will fix the bug soon.', 'She wants to report a new bug.'],
      answer: 1,
      explanation: 'The woman repeats the same excuse was given last month, implying she doesn\'t believe the team will act quickly.',
      tip: 'Implied meaning questions: the TONE and CONTEXT matter more than the literal words. Frustration + repetition = doubt/disbelief.',
    },
  },
  {
    id: 'imp_02',
    theme: 'Reluctant Agreement',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'We really need someone to cover the reception desk this Saturday.' },
      { speaker: 'A', text: 'I suppose I could come in, but I was planning to visit my parents.' },
      { speaker: 'B', text: 'I really appreciate it. I\'ll make sure you get comp time next week.' },
      { speaker: 'A', text: 'All right, I\'ll be there at nine.' },
    ],
    question: {
      question: 'What does the woman imply when she says "I suppose I could come in"?',
      options: ['She is eager to work on Saturday.', 'She is agreeing but is not enthusiastic.', 'She refuses to work on Saturday.'],
      answer: 1,
      explanation: '"I suppose I could" + "but I was planning to" = reluctant/unenthusiastic agreement.',
      tip: '"I suppose," "I guess," "I could, but…" = reluctant agreement. This appears often in Part 3 implied meaning questions.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.native_speed  — TOEIC 800+ authentic audio (fast)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_NATIVE_SPEED: DialoguePack[] = [
  {
    id: 'ns_01',
    theme: 'Earnings Call Fragment',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'Our Q3 revenue came in at two point four billion, representing a twelve percent year-over-year growth, which exceeded analyst expectations by roughly three hundred million.' },
      { speaker: 'B', text: 'That\'s impressive. To what do you attribute this outperformance?' },
      { speaker: 'A', text: 'Primarily the strong performance of our cloud services division, which grew forty percent quarter on quarter.' },
    ],
    question: {
      question: 'What was the main driver of the company\'s strong Q3 performance?',
      options: ['Expansion into new markets', 'Strong performance of the cloud services division', 'Cost-cutting initiatives'],
      answer: 1,
      explanation: 'The speaker says "primarily the strong performance of our cloud services division."',
      tip: 'At native speed, focus on KEY NOUNS and numbers: revenue figure, growth % and division name.',
    },
  },
  {
    id: 'ns_02',
    theme: 'Unscripted Meeting',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'Look, I\'m going to be straight with you — the timeline is aggressive and frankly, I\'m not confident we can hit the December deadline without compromising quality.' },
      { speaker: 'A', text: 'I hear you, and I appreciate the honesty. What would you need to make it work?' },
      { speaker: 'B', text: 'Two more engineers on the backend team, at minimum.' },
    ],
    question: {
      question: 'What does the man say is needed to meet the deadline?',
      options: ['A budget increase', 'Two more engineers', 'An extended timeline'],
      answer: 1,
      explanation: '"Two more engineers on the backend team, at minimum."',
      tip: 'In informal / fast speech: "I\'m going to be straight with you" = I will say something direct/difficult. Focus on what comes after.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.sec1_form  — IELTS Section 1 (Form Completion)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_SEC1_FORM: DialoguePack[] = [
  {
    id: 'sec1_01',
    theme: 'Gym Registration',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'A', text: 'Hello, I\'d like to register for a gym membership.' },
      { speaker: 'B', text: 'Of course! Can I take your full name, please?' },
      { speaker: 'A', text: 'It\'s Michael Turner.' },
      { speaker: 'B', text: 'And your date of birth?' },
      { speaker: 'A', text: 'The fifteenth of March, nineteen ninety-two.' },
      { speaker: 'B', text: 'Which membership type would you like? We have basic, standard, and premium.' },
      { speaker: 'A', text: 'I\'ll go with the standard one, please.' },
    ],
    question: {
      question: 'What type of membership does the man choose?',
      options: ['Basic', 'Standard', 'Premium'],
      answer: 1,
      explanation: 'He says "I\'ll go with the standard one."',
      tip: 'IELTS Section 1 form completion: the answer is usually spoken clearly and directly. Do not over-think.',
    },
  },
  {
    id: 'sec1_02',
    theme: 'Library Card',
    difficulty: 'easy',
    dialogue: [
      { speaker: 'B', text: 'Welcome to Oakwood Library. How can I help you?' },
      { speaker: 'A', text: 'I\'d like to get a library card.' },
      { speaker: 'B', text: 'Great. What\'s your address?' },
      { speaker: 'A', text: '45 Birchwood Avenue, Oakwood.' },
      { speaker: 'B', text: 'And a contact number?' },
      { speaker: 'A', text: 'Zero seven seven eight, double four, three six one.' },
    ],
    question: {
      question: 'What is the woman\'s address?',
      options: ['14 Birchwood Avenue', '45 Birchwood Avenue', '54 Birchwood Road'],
      answer: 1,
      explanation: 'She clearly states "45 Birchwood Avenue."',
      tip: 'Numbers and addresses are key in Section 1. Write them as you hear — do not confuse 45 and 54.',
    },
  },
  {
    id: 'sec1_03',
    theme: 'Hotel Booking',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Good afternoon, I\'d like to make a reservation.' },
      { speaker: 'B', text: 'Certainly. What dates are you looking at?' },
      { speaker: 'A', text: 'From the twentieth to the twenty-third of October.' },
      { speaker: 'B', text: 'And how many guests?' },
      { speaker: 'A', text: 'Two adults and one child.' },
      { speaker: 'B', text: 'Would you prefer a room with a sea view or a garden view?' },
      { speaker: 'A', text: 'Sea view, please.' },
    ],
    question: {
      question: 'What type of room view does the guest request?',
      options: ['Garden view', 'Sea view', 'City view'],
      answer: 1,
      explanation: '"Sea view, please."',
      tip: 'Options involving views/locations are classic Section 1 traps. You hear all three (sea, garden, city) in context.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.sec2_note  — IELTS Section 2 (Note Completion)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_SEC2_NOTE: DialoguePack[] = [
  {
    id: 'sec2_01',
    theme: 'Community Centre Talk',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'Good evening, and welcome to the Greenford Community Centre orientation. I\'m going to cover the facilities available to members. Our fitness room is open seven days a week from six a.m. to ten p.m. The swimming pool is available Monday to Saturday only, and it\'s closed on Sundays for maintenance. The café on the ground floor serves hot meals until eight p.m. You\'ll also find a reading room on the first floor, which is open until nine p.m. on weekdays.' },
    ],
    question: {
      question: 'Why is the swimming pool closed on Sundays?',
      options: ['It is reserved for private events.', 'It is closed for maintenance.', 'The staff have a day off.'],
      answer: 1,
      explanation: '"Closed on Sundays for maintenance."',
      tip: 'IELTS Section 2 monologues often explain WHY something is closed or unavailable. Listen for reason words: "for," "due to," "because of."',
    },
  },
  {
    id: 'sec2_02',
    theme: 'Tour Guide Intro',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Welcome to the Hartfield Museum of Natural History. Today\'s tour will last approximately ninety minutes. We\'ll begin in the Ancient Civilizations gallery, then move through the Natural Wonders exhibit, and finish in the recently opened Ocean Life section. Photography is welcome throughout, but please turn off your flash in the Ancient Civilizations gallery to protect the artifacts. Restrooms are located near the main entrance and on the second floor.' },
    ],
    question: {
      question: 'Where should visitors turn off their camera flash?',
      options: ['In the Natural Wonders exhibit', 'In the Ancient Civilizations gallery', 'In the Ocean Life section'],
      answer: 1,
      explanation: '"Turn off your flash in the Ancient Civilizations gallery to protect the artifacts."',
      tip: 'Restriction questions: the key word is "but" — it signals a rule change compared to the general permission.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.sec3_conv  — IELTS Section 3 (Academic Conversation)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_SEC3_CONV: DialoguePack[] = [
  {
    id: 'sec3_01',
    theme: 'Group Project Discussion',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Have you started on the literature review for the ecology project yet?' },
      { speaker: 'B', text: 'I\'ve read about half the sources. I think we should focus mainly on the impact of urbanization rather than agriculture — there\'s more recent data.' },
      { speaker: 'A', text: 'That makes sense. But we should probably mention agriculture briefly so the report doesn\'t seem too narrow.' },
      { speaker: 'B', text: 'Agreed. I can write a short paragraph on it.' },
      { speaker: 'A', text: 'Great. And I\'ll work on the methodology section this weekend.' },
    ],
    question: {
      question: 'What do the students agree to focus on primarily in their report?',
      options: ['The impact of agriculture', 'The impact of urbanization', 'Both equally'],
      answer: 1,
      explanation: '"We should focus mainly on the impact of urbanization — there\'s more recent data." The other student agrees.',
      tip: 'Academic discussion questions: look for agreement signals (Agreed / That makes sense / Right). The agreed topic is the answer.',
    },
  },
  {
    id: 'sec3_02',
    theme: 'Tutor Feedback',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'I\'ve read your draft, and overall it\'s well-structured. However, your argument in section two lacks evidence. You make a strong claim but don\'t cite any sources.' },
      { speaker: 'A', text: 'I was planning to add those later. Should I use primary or secondary sources?' },
      { speaker: 'B', text: 'For a claim that bold, you\'ll want primary research — ideally peer-reviewed journal articles.' },
      { speaker: 'A', text: 'Okay, I\'ll search the university database this afternoon.' },
    ],
    question: {
      question: 'What does the tutor recommend the student add to section two?',
      options: ['A clearer structure', 'Evidence from peer-reviewed journal articles', 'More examples from news articles'],
      answer: 1,
      explanation: '"For a claim that bold, you\'ll want primary research — ideally peer-reviewed journal articles."',
      tip: 'Tutor feedback dialogues: the tutor\'s recommendation is the answer. Adjectives matter: "peer-reviewed" ≠ "news articles."',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.sec4_lecture  — IELTS Section 4 (Academic Lecture)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_SEC4_LECTURE: DialoguePack[] = [
  {
    id: 'sec4_01',
    theme: 'Environmental Science',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'Today I want to talk about microplastics and their effect on marine ecosystems. Microplastics are plastic particles smaller than five millimetres. They enter the ocean primarily through two routes: the breakdown of larger plastic waste, and synthetic fibers released during washing of clothes. Once in the water, they are consumed by small organisms at the base of the food chain, and through a process called biomagnification, concentrations increase as you move up to larger predators.' },
    ],
    question: {
      question: 'According to the lecture, what causes microplastic concentrations to increase in larger predators?',
      options: ['Direct dumping of waste into the ocean', 'Biomagnification through the food chain', 'Synthetic fiber production'],
      answer: 1,
      explanation: '"Through a process called biomagnification, concentrations increase as you move up to larger predators."',
      tip: 'Academic lectures introduce technical terms. When you hear a new term defined (biomagnification), it WILL be tested. Write it down.',
    },
  },
  {
    id: 'sec4_02',
    theme: 'History of Cities',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'The rapid growth of cities in the nineteenth century was largely driven by industrialisation. Factories required large numbers of workers, which led to mass migration from rural to urban areas. However, city infrastructure — housing, sanitation, transport — could not keep pace, resulting in severe overcrowding and disease outbreaks, most notably cholera epidemics in London and other European cities.' },
    ],
    question: {
      question: 'What was the main consequence of rapid urbanisation in the nineteenth century?',
      options: ['Improved transportation networks', 'Overcrowding and disease outbreaks', 'Growth of rural farming communities'],
      answer: 1,
      explanation: '"Severe overcrowding and disease outbreaks, most notably cholera epidemics."',
      tip: 'Cause-effect in lectures: "…led to…", "…resulting in…", "…which caused…" — these signal the answer to consequence questions.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.attitude  — Speaker Attitude & Opinion
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_ATTITUDE: DialoguePack[] = [
  {
    id: 'att_01',
    theme: 'New Policy',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'Did you hear about the new open-plan office layout they\'re planning?' },
      { speaker: 'B', text: 'I did. Honestly, I\'m not exactly thrilled about it. Research shows it actually reduces productivity for focused work.' },
      { speaker: 'A', text: 'Really? I thought it would help team communication.' },
      { speaker: 'B', text: 'That\'s what management thinks too — but for technical work, the distractions outweigh the benefits.' },
    ],
    question: {
      question: 'What is the man\'s attitude toward the new office layout?',
      options: ['Enthusiastic', 'Skeptical', 'Neutral'],
      answer: 1,
      explanation: '"Not exactly thrilled," "distractions outweigh the benefits" = skeptical attitude.',
      tip: 'Attitude words: enthusiastic = very positive | skeptical/doubtful = not convinced | neutral = neither positive nor negative.',
    },
  },
  {
    id: 'att_02',
    theme: 'Research Results',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'The preliminary results look promising, don\'t they?' },
      { speaker: 'B', text: 'I want to be cautious. The sample size is too small to draw any firm conclusions.' },
      { speaker: 'A', text: 'Fair point. Should we extend the study?' },
      { speaker: 'B', text: 'Absolutely. I think we\'d be doing a disservice to the field by publishing now.' },
    ],
    question: {
      question: 'What is the woman\'s attitude toward publishing the results now?',
      options: ['She supports publishing now.', 'She thinks it would be premature to publish.', 'She is indifferent to publishing.'],
      answer: 1,
      explanation: '"We\'d be doing a disservice to the field by publishing now" = she opposes premature publishing.',
      tip: '"Cautious," "too small to draw conclusions," "disservice" = all signal caution/opposition.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.note_symbols  — Note-taking technique (IELTS)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_NOTE_SYMBOLS: DialoguePack[] = [
  {
    id: 'ns_ielts_01',
    theme: 'Study Skills Seminar',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'B', text: 'Today we\'re going to discuss effective note-taking strategies for academic listening. The first key technique is to use abbreviations. For example, write "w/" for "with", "→" for "leads to" or "causes", and "∴" for "therefore." This allows you to capture information quickly without missing what comes next.' },
      { speaker: 'A', text: 'What about numbers and statistics? Those come up fast.' },
      { speaker: 'B', text: 'Good question. Always write numbers as numerals — so "twenty-three" becomes "23" instantly. For large numbers, use "k" for thousand and "m" for million.' },
    ],
    question: {
      question: 'According to the speaker, what symbol represents "therefore"?',
      options: ['→', '∴', 'w/'],
      answer: 1,
      explanation: '"∴" for "therefore" is explicitly stated.',
      tip: 'Symbol/abbreviation questions: the speaker will say "X means Y." Listen for "stands for," "represents," "means."',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.paraphrase  — Paraphrase Recognition
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_PARAPHRASE: DialoguePack[] = [
  {
    id: 'para_01',
    theme: 'Paraphrase in Options',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'The conference has been postponed until further notice due to unforeseen circumstances.' },
      { speaker: 'B', text: 'Does that mean we should cancel our travel arrangements?' },
      { speaker: 'A', text: 'For now, yes. We\'ll send out a new invitation once the date is confirmed.' },
    ],
    question: {
      question: 'What has happened to the conference?',
      options: ['It has been cancelled permanently.', 'It has been delayed to an unspecified date.', 'It has been moved to a different city.'],
      answer: 1,
      explanation: '"Postponed until further notice" = delayed to an unspecified date (paraphrase).',
      tip: '"Postponed until further notice" ≠ cancelled. IELTS loves paraphrasing: "postponed" → "delayed," "further notice" → "unspecified date."',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.multi_level  — Multi-level Inference (IELTS 6.5+)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_MULTI_LEVEL: DialoguePack[] = [
  {
    id: 'ml_01',
    theme: 'Academic Decision',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'B', text: 'I\'ve been thinking about dropping the advanced statistics module. It\'s really overwhelming this semester.' },
      { speaker: 'A', text: 'I understand, but it\'s a compulsory module for your degree, isn\'t it?' },
      { speaker: 'B', text: 'It is. But I\'ve heard the re-sit is a lot less stressful than the main assessment.' },
      { speaker: 'A', text: 'That might be true, but your GPA will still reflect the lower grade.' },
    ],
    question: {
      question: 'What can be inferred about the student considering dropping the module?',
      options: ['He has already spoken to his advisor.', 'He may be considering taking a resit to reduce pressure.', 'He plans to change his degree programme.'],
      answer: 1,
      explanation: 'He mentions the resit being "a lot less stressful" — implying he may be thinking of intentionally failing and resitting.',
      tip: 'Inference questions: do not pick answers stated directly. Choose what can LOGICALLY be concluded from indirect hints.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.map_plan  — IELTS Map/Plan Labelling (as dialogue)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_MAP_PLAN: DialoguePack[] = [
  {
    id: 'map_01',
    theme: 'Campus Map',
    difficulty: 'medium',
    dialogue: [
      { speaker: 'A', text: 'Welcome to Westfield Campus. If you\'re looking at the main entrance at the bottom of the map, the library is directly ahead of you, at the top of the central path. The student union is to your left as you enter, and the sports centre is to the right, next to the car park.' },
    ],
    question: {
      question: 'Where is the student union located?',
      options: ['To the right of the main entrance', 'To the left of the main entrance', 'At the top of the central path'],
      answer: 1,
      explanation: '"The student union is to your left as you enter" = to the left of the main entrance.',
      tip: 'Map questions: orient yourself from the stated viewpoint (main entrance). Left/right from the entrance is from YOUR perspective facing inward.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.nuanced_attitude  — Nuanced attitudes (IELTS 7.5+)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_NUANCED_ATTITUDE: DialoguePack[] = [
  {
    id: 'na_01',
    theme: 'Policy Skepticism',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'The government\'s new education funding plan sounds ambitious, doesn\'t it?' },
      { speaker: 'B', text: 'On paper, yes. But I\'ll believe it when I see the actual allocation figures. We\'ve had promising announcements before.' },
    ],
    question: {
      question: 'Which word best describes the man\'s attitude toward the funding plan?',
      options: ['Enthusiastic', 'Concerned', 'Sceptical'],
      answer: 2,
      explanation: '"I\'ll believe it when I see it" + "promising announcements before" = classic scepticism.',
      tip: '"On paper, yes… but" = concession + contradiction. This pattern almost always signals scepticism or doubt in IELTS attitude questions.',
    },
  },
  {
    id: 'na_02',
    theme: 'Research Enthusiasm',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'So, you\'re taking on another research project on top of your thesis?' },
      { speaker: 'B', text: 'I know it sounds crazy, but the topic is genuinely fascinating — I can\'t help myself. Sleep is overrated anyway.' },
    ],
    question: {
      question: 'What attitude does the woman convey when she says "Sleep is overrated anyway"?',
      options: ['She is complaining about the workload.', 'She is enthusiastically dismissing the difficulty.', 'She is asking for help.'],
      answer: 1,
      explanation: '"Can\'t help myself" + joking about sleep = enthusiastic engagement despite the challenge.',
      tip: 'Humour/irony in IELTS: "Sleep is overrated" is self-deprecating humour, not a real complaint. Tone = enthusiastic.',
    },
  },
]

// ══════════════════════════════════════════════════════════════════════════════
// listening.rapid_accents  — Multiple accents at native speed (IELTS 7.5+)
// ══════════════════════════════════════════════════════════════════════════════
export const PACKS_RAPID_ACCENTS: DialoguePack[] = [
  {
    id: 'ra_01',
    theme: 'Scottish Accent',
    difficulty: 'hard',
    dialogue: [
      { speaker: 'A', text: 'Aye, the conference was absolutely brilliant. The keynote speaker was a wee bit long-winded, but the workshops were dead useful.' },
      { speaker: 'B', text: 'I heard the turnout was much better than last year. Over three hundred delegates apparently.' },
    ],
    question: {
      question: 'What does the woman say about the keynote speaker?',
      options: ['The speaker was too brief.', 'The speaker spoke for too long.', 'The speaker was the best part.'],
      answer: 1,
      explanation: '"A wee bit long-winded" = spoke for too long (Scottish English informal).',
      tip: '"Long-winded" = talking too much / too long. "A wee bit" = a little (Scottish). Dialect vocabulary matters at IELTS 7.5+.',
    },
  },
]

// ─── Master lookup map ─────────────────────────────────────────────────────────

export const LISTENING_PACKS_BY_KEY: Record<string, DialoguePack[]> = {
  // TOEIC
  'listening.part1_photos':   PACKS_PART1_PHOTOS,
  'listening.part2_q_r':      PACKS_PART2_QR,
  'listening.part3_short':    PACKS_PART3_SHORT,
  'listening.part4_short':    PACKS_PART4_SHORT,
  'listening.part3_graphics': PACKS_PART3_GRAPHICS,
  'listening.part4_varied':   PACKS_PART4_VARIED,
  'listening.implication':    PACKS_IMPLICATION,
  'listening.native_speed':   PACKS_NATIVE_SPEED,
  // IELTS
  'listening.sec1_form':        PACKS_SEC1_FORM,
  'listening.sec2_note':        PACKS_SEC2_NOTE,
  'listening.note_symbols':     PACKS_NOTE_SYMBOLS,
  'listening.sec3_conv':        PACKS_SEC3_CONV,
  'listening.paraphrase':       PACKS_PARAPHRASE,
  'listening.sec4_lecture':     PACKS_SEC4_LECTURE,
  'listening.map_plan':         PACKS_MAP_PLAN,
  'listening.attitude':         PACKS_ATTITUDE,
  'listening.multi_level':      PACKS_MULTI_LEVEL,
  'listening.nuanced_attitude': PACKS_NUANCED_ATTITUDE,
  'listening.rapid_accents':    PACKS_RAPID_ACCENTS,
}

/** Return a deterministic-but-seemingly-random pack for a student session. */
export function getRandomPack(topicKey: string, seed?: number): DialoguePack | null {
  const packs = LISTENING_PACKS_BY_KEY[topicKey]
  if (!packs || packs.length === 0) return null
  const index = seed !== undefined ? seed % packs.length : Math.floor(Math.random() * packs.length)
  return packs[index]
}
