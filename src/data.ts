import type {
  Job, Candidate, Interview, Email,
  AuditEntry, ActivityItem, CandidateStageKey,
} from '@/types';

export const INITIAL_JOBS: Job[] = [
  { id:'job-001', title:'Senior Product Designer', dept:'Design',       type:'Full-time', location:'Remote',          status:'Open',   applicants:47, salary:'$90k–$120k',  skills:'Figma, Design Systems, Prototyping', desc:"We're looking for a talented designer to join our growing team.", created:'15 Feb 2026' },
  { id:'job-002', title:'Backend Engineer',         dept:'Engineering', type:'Full-time', location:'Hybrid · London', status:'Open',   applicants:83, salary:'$100k–$140k', skills:'Node.js, PostgreSQL, AWS',           desc:'Join our platform team to build scalable APIs.',                created:'10 Feb 2026' },
  { id:'job-003', title:'Head of Marketing',        dept:'Marketing',   type:'Full-time', location:'Remote',          status:'Open',   applicants:29, salary:'$80k–$110k',  skills:'SEO, Growth, Brand',                 desc:'Lead our marketing function through the next growth phase.',    created:'8 Feb 2026'  },
  { id:'job-004', title:'Data Analyst',             dept:'Data',        type:'Full-time', location:'On-site · Harare',status:'Open',   applicants:54, salary:'$60k–$85k',   skills:'SQL, Python, Tableau',               desc:'Turn data into insights across our pipelines.',                 created:'2 Feb 2026'  },
  { id:'job-005', title:'Product Manager',          dept:'Product',     type:'Full-time', location:'Remote',          status:'Draft',  applicants:0,  salary:'$95k–$130k',  skills:'Roadmapping, Agile, JIRA',           desc:'Define the roadmap for our ATS product suite.',                 created:'1 Mar 2026'  },
  { id:'job-006', title:'DevOps Engineer',          dept:'Engineering', type:'Contract',  location:'Remote',          status:'Paused', applicants:18, salary:'$120k–$160k', skills:'Kubernetes, Terraform, CI/CD',        desc:'Help scale our infrastructure for global growth.',              created:'20 Jan 2026' },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  { id:'c001', name:'Lena Müller',    email:'lena@example.com',   role:'Product Designer',  stage:'Final Round', stageKey:'Final'     as CandidateStageKey, source:'LinkedIn',  score:88, applied:'Mar 2',  initials:'LM' },
  { id:'c002', name:'Amara Dube',     email:'amara@example.com',  role:'Product Designer',  stage:'Offer Sent',  stageKey:'Offer'     as CandidateStageKey, source:'Referral',  score:94, applied:'Feb 28', initials:'AD' },
  { id:'c003', name:'Marcus Khumalo', email:'marcus@example.com', role:'Backend Engineer',  stage:'Screening',   stageKey:'Screening' as CandidateStageKey, source:'Direct',    score:72, applied:'Feb 24', initials:'MK' },
  { id:'c004', name:'Priya Nair',     email:'priya@example.com',  role:'Head of Marketing', stage:'Interview',   stageKey:'Interview' as CandidateStageKey, source:'LinkedIn',  score:81, applied:'Feb 18', initials:'PN' },
  { id:'c005', name:'Zanele Moyo',    email:'zanele@example.com', role:'Product Designer',  stage:'Applied',     stageKey:'Applied'   as CandidateStageKey, source:'Job Board', score:65, applied:'Mar 14', initials:'ZM' },
  { id:'c006', name:'Kwame Osei',     email:'kwame@example.com',  role:'Data Analyst',      stage:'Rejected',    stageKey:'Rejected'  as CandidateStageKey, source:'Direct',    score:44, applied:'Mar 10', initials:'KO' },
  { id:'c007', name:'Sofia Reyes',    email:'sofia@example.com',  role:'Backend Engineer',  stage:'Interview',   stageKey:'Interview' as CandidateStageKey, source:'LinkedIn',  score:79, applied:'Mar 5',  initials:'SR' },
  { id:'c008', name:'Ahmed Hassan',   email:'ahmed@example.com',  role:'Backend Engineer',  stage:'Final Round', stageKey:'Final'     as CandidateStageKey, source:'Referral',  score:85, applied:'Mar 1',  initials:'AH' },
];

export const INITIAL_INTERVIEWS: Interview[] = [
  { id:1, candidate:'Lena Müller',   role:'Product Designer',  type:'Final',     date:'2026-03-16', time:'10:00', duration:60, interviewers:'Tino Dube',        videoLink:'meet.google.com/hf-abc111', notes:'',                     status:'Scheduled' },
  { id:2, candidate:'Kwame Osei',    role:'Data Analyst',      type:'Technical', date:'2026-03-16', time:'14:30', duration:90, interviewers:'James Khumalo',    videoLink:'meet.google.com/hf-abc222', notes:'Bring coding exercise', status:'Completed' },
  { id:3, candidate:'Priya Nair',    role:'Head of Marketing', type:'Screening', date:'2026-03-16', time:'16:00', duration:30, interviewers:'Sarah Moyo',       videoLink:'meet.google.com/hf-abc333', notes:'',                     status:'No-show'   },
  { id:4, candidate:'Sofia Reyes',   role:'Backend Engineer',  type:'Screening', date:'2026-03-17', time:'10:00', duration:30, interviewers:'Tino Dube',        videoLink:'meet.google.com/hf-abc444', notes:'',                     status:'Scheduled' },
  { id:5, candidate:'Ahmed Hassan',  role:'Backend Engineer',  type:'Final',     date:'2026-03-18', time:'13:00', duration:60, interviewers:'Tino Dube, Sarah', videoLink:'meet.google.com/hf-abc555', notes:'Panel interview',       status:'Scheduled' },
  { id:6, candidate:'Zanele Moyo',   role:'Product Designer',  type:'Culture',   date:'2026-03-18', time:'15:00', duration:30, interviewers:'Sarah Moyo',       videoLink:'meet.google.com/hf-abc666', notes:'',                     status:'Scheduled' },
];

export const INITIAL_EMAILS: Email[] = [
  { id:'e1', from:'Lena Müller',    addr:'lena@example.com',   subject:'Re: Final round scheduling',   preview:"Hi Tino, I'm available tomorrow at 10am…", time:'10:24 AM',  unread:false, body:"Hi Tino,\n\nThanks for reaching out. I'm available tomorrow from 9am–12pm or after 3pm.\n\n— Lena" },
  { id:'e2', from:'Kwame Osei',     addr:'kwame@example.com',  subject:'Technical assessment question', preview:'Just wanted to clarify one thing…',          time:'9:51 AM',   unread:true,  body:"Hi,\n\nJust wanted to clarify — are we expected to use a specific framework?\n\nThanks,\nKwame" },
  { id:'e3', from:'Amara Dube',     addr:'amara@example.com',  subject:'Offer letter — thank you!',    preview:"Hi, I'm so excited about this…",              time:'Yesterday', unread:false, body:"Hi Tino,\n\nI'm thrilled to accept the offer! When should I expect onboarding?\n\nBest,\nAmara" },
  { id:'e4', from:'Priya Nair',     addr:'priya@example.com',  subject:'Interview feedback request',   preview:'Any update on my interview?',                 time:'Yesterday', unread:true,  body:"Hello,\n\nI wanted to follow up on our interview. Any feedback?\n\nBest,\nPriya" },
  { id:'e5', from:'Marcus Khumalo', addr:'marcus@example.com', subject:'Portfolio link updated',       preview:"Here's the updated portfolio link…",          time:'Mar 14',    unread:true,  body:"Hi Tino,\n\nUpdated portfolio: portfolio.marcus.dev\n\nThanks,\nMarcus" },
];

export const INITIAL_AUDIT: AuditEntry[] = [
  { actor:'Tino Dube', action:'Advanced Lena Müller from Screening → Final Round', time:'2 min ago'  },
  { actor:'Tino Dube', action:'Sent Offer Letter to Amara Dube',                   time:'18 min ago' },
  { actor:'James K.',  action:'Submitted scorecard for Priya Nair — Score: 4.2/5', time:'1 hr ago'   },
  { actor:'Tino Dube', action:'Posted new job: Data Analyst',                       time:'2 hr ago'   },
  { actor:'Sarah M.',  action:'Added candidate Zanele Moyo via Job Board',          time:'3 hr ago'   },
  { actor:'Tino Dube', action:'Scheduled interview for Lena Müller — Mon 16 10:00',time:'Yesterday'  },
  { actor:'System',    action:'AI CV analysis completed for Marcus Khumalo — 72',   time:'Yesterday'  },
];

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { color:'var(--green)',  text:'<strong>Amara Dube</strong> accepted the offer for <strong>Senior Designer</strong>',  time:'2 min ago'  },
  { color:'var(--blue2)', text:'<strong>Marcus Khumalo</strong> moved to <strong>Final Interview</strong>',              time:'18 min ago' },
  { color:'var(--amber)', text:'Scorecard submitted for <strong>Priya Nair</strong> — CV Score 4.2/5',                  time:'1 hr ago'   },
  { color:'var(--blue2)', text:'<strong>12 new applications</strong> received for <strong>Backend Engineer</strong>',    time:'2 hr ago'   },
  { color:'var(--green)', text:'<strong>Lena Müller</strong> booked her final round for tomorrow at 10am',               time:'3 hr ago'   },
];

export const STAGE_PROGRESSION: Readonly<Record<string, string>> = {
  'Applied':     'Screening',
  'Screening':   'Interview',
  'Interview':   'Final Round',
  'Final Round': 'Offer Sent',
  'Offer Sent':  'Hired',
};

export const EMAIL_TEMPLATES: Readonly<Record<string, string>> = {
  'Reply':           '',
  'Offer Letter':    'Dear [Name],\n\nWe are thrilled to offer you the position of [Role] at HireFlow.\n\nPlease review the attached offer letter and respond by [Date].\n\nWarm regards,\nTino',
  'Rejection':       'Dear [Name],\n\nThank you for your interest in the [Role] position. After careful consideration we have decided to move forward with other candidates.\n\nBest regards,\nTino',
  'Interview Invite':'Dear [Name],\n\nWe would like to invite you for a [Type] interview for the [Role] position.\n\nDate: [Date] · Time: [Time] · Format: Video call\n\nPlease confirm your availability.\n\nBest regards,\nTino',
};
