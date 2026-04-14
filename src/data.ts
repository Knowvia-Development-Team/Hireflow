import type {
  Job, Candidate, Interview, Email,
  AuditEntry, ActivityItem, CandidateStageKey,
} from '@/types';

export const INITIAL_JOBS: Job[] = [
  { id:'job-101', title:'Product Designer',         dept:'Design',      type:'Full-time', location:'Remote',            status:'Open',   applicants:32, salary:'$80k-$105k', skills:'Figma, UX Research, Design Systems', desc:'Own end-to-end product design for our hiring platform.', created:'12 Feb 2026' },
  { id:'job-102', title:'Backend Engineer',         dept:'Engineering', type:'Full-time', location:'Hybrid - London',   status:'Open',   applicants:58, salary:'$110k-$145k', skills:'Node.js, PostgreSQL, AWS',            desc:'Build scalable APIs and data services for our ATS.',    created:'9 Feb 2026'  },
  { id:'job-103', title:'Data Analyst',             dept:'Data',        type:'Full-time', location:'On-site - Harare',  status:'Open',   applicants:41, salary:'$55k-$72k',  skills:'SQL, Python, BI Tools',               desc:'Turn product data into insights and reporting.',        created:'5 Feb 2026'  },
  { id:'job-104', title:'Customer Success Manager', dept:'Customer',    type:'Full-time', location:'Remote',            status:'Open',   applicants:19, salary:'$60k-$75k',  skills:'Onboarding, Retention, CRM',          desc:'Drive adoption and outcomes for mid-market clients.',   created:'2 Mar 2026'  },
  { id:'job-105', title:'Frontend Engineer',        dept:'Engineering', type:'Full-time', location:'Remote',            status:'Draft',  applicants:0,  salary:'$95k-$125k', skills:'React, TypeScript, Vite',             desc:'Own the recruiter dashboard experience.',              created:'1 Mar 2026'  },
  { id:'job-106', title:'Security Analyst',         dept:'Security',    type:'Contract',  location:'Remote',            status:'Paused', applicants:7,  salary:'$70k-$95k',  skills:'SOC, Incident Response, SIEM',        desc:'Help improve our detection and response workflows.',    created:'18 Jan 2026' },
  { id:'job-107', title:'Software Developer (Junior)', dept:'Engineering', type:'Full-time', location:'On-site - Harare', status:'Open', applicants:12, salary:'$20k-$28k', skills:'Java, PHP, JavaScript, MySQL, MongoDB, Debugging', desc:'Develop and maintain web and mobile applications. Collaborate with designers and other developers. Debug and test software.', created:'1 Apr 2026' },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  { id:'c101', name:'Ruth Mlambo',     email:'ruth.mlambo@northgrid.io',  role:'Product Designer',         stage:'Final Round', stageKey:'Final'     as CandidateStageKey, source:'Portfolio', score:90, applied:'Mar 3',  initials:'RM' },
  { id:'c102', name:'Noah Patel',      email:'noah.patel@brightmail.co',  role:'Backend Engineer',         stage:'Screening',   stageKey:'Screening' as CandidateStageKey, source:'LinkedIn',  score:76, applied:'Feb 27', initials:'NP' },
  { id:'c103', name:'Linda Chipo',     email:'linda.chipo@flowlabs.dev',  role:'Data Analyst',             stage:'Interview',   stageKey:'Interview' as CandidateStageKey, source:'Referral',  score:81, applied:'Feb 22', initials:'LC' },
  { id:'c104', name:'Samir Okoye',     email:'samir.okoye@kivunet.ai',    role:'Customer Success Manager', stage:'Applied',     stageKey:'Applied'   as CandidateStageKey, source:'Job Board', score:68, applied:'Mar 14', initials:'SO' },
  { id:'c105', name:'Zoe Ncube',       email:'zoe.ncube@skyway.dev',      role:'Frontend Engineer',        stage:'Applied',     stageKey:'Applied'   as CandidateStageKey, source:'Direct',    score:64, applied:'Mar 12', initials:'ZN' },
  { id:'c106', name:'Tawanda Moyo',    email:'tawanda.moyo@email.com',   role:'Software Developer (Junior)', stage:'Applied', stageKey:'Applied' as CandidateStageKey, source:'CV Upload', score:82, applied:'Apr 1', initials:'TM',
    cvText:
      'Detail-oriented Junior Software Developer with strong foundations in full-stack development, database design, and software engineering principles. ' +
      'Experienced in building scalable web applications and solving real-world problems using Java, PHP, and JavaScript. ' +
      'Technical skills: Java, PHP, JavaScript, SQL, HTML5, CSS3, Bootstrap, Laravel (Basic), Node.js (Basic), MySQL, MongoDB, Git, REST APIs, SDLC, Agile. ' +
      'Assisted in developing and maintaining company web applications. Debugged and resolved system issues, improving performance by 20%.',
    skillGap: {
      fitScore: 82,
      confidence: 74,
      needsReview: false,
      explanations: [
        'Job taxonomy derived from 7 skill entries found in the job text.',
        'Matched 6/7 required skills.',
        'Missing skills include: Testing, Mobile Development.',
      ],
      version: 'skill-gap-v2',
      strengths: [
        { skill:'Java', evidence:['Experienced in building scalable web applications using Java, PHP, and JavaScript.'] },
        { skill:'JavaScript', evidence:['Experienced in building scalable web applications and solving real-world problems using Java, PHP, and JavaScript.'] },
        { skill:'MySQL', evidence:['Technical skills: Java, PHP, JavaScript, SQL, HTML5, CSS3, Bootstrap, Laravel (Basic), Node.js (Basic), MySQL, MongoDB, Git, REST APIs, SDLC, Agile.'] },
      ],
      missing: [
        { skill:'Testing', reason:'Required by the job, but not mentioned in the CV.' },
        { skill:'Mobile Development', reason:'Job mentions mobile applications; no explicit mobile stack listed in the CV.' },
      ],
      summary: [
        'Fit score: 82/100.',
        'Required skills matched: 6/7.',
        'Strengths: Java, JavaScript, MySQL.',
        'Missing: Testing, Mobile Development.',
      ],
    },
  },
  { id:'c107', name:'Aisha Kelvin',   email:'aisha.kelvin@zenmetrics.com', role:'Backend Engineer',       stage:'Interview',   stageKey:'Interview' as CandidateStageKey, source:'Referral',  score:84, applied:'Mar 6',  initials:'AK' },
  { id:'c108', name:'Marco Silva',    email:'marco.silva@westline.io',     role:'Security Analyst',       stage:'Rejected',    stageKey:'Rejected'  as CandidateStageKey, source:'Direct',    score:49, applied:'Mar 9',  initials:'MS' },
];

export const INITIAL_INTERVIEWS: Interview[] = [];

export const INITIAL_EMAILS: Email[] = [
  { id:'e101', from:'Ruth Mlambo',  addr:'ruth.mlambo@northgrid.io',   subject:'Re: Final round scheduling',  preview:'Hi team, I can do Thursday morning.', time:'10:24 AM',  unread:false, body:"Hi team,\n\nI can do Thursday morning or Friday after 2pm.\n\nThanks,\nRuth" },
  { id:'e102', from:'Noah Patel',   addr:'noah.patel@brightmail.co',   subject:'Technical assessment question', preview:'Quick question about the API task...', time:'9:51 AM', unread:true,  body:"Hi,\n\nIs it okay to use NestJS for the assessment?\n\nThanks,\nNoah" },
  { id:'e103', from:'Linda Chipo',  addr:'linda.chipo@flowlabs.dev',   subject:'Interview follow-up',          preview:'Thank you for the interview today.', time:'Yesterday', unread:false, body:"Thanks for the interview today. I enjoyed learning about the data team.\n\nBest,\nLinda" },
  { id:'e104', from:'Samir Okoye',  addr:'samir.okoye@kivunet.ai',     subject:'Portfolio link',              preview:'Sharing my onboarding playbook...', time:'Mar 14',   unread:true,  body:"Here is a link to my onboarding playbook and QBR template.\n\nSamir" },
  { id:'e105', from:'Aisha Kelvin', addr:'aisha.kelvin@zenmetrics.com', subject:'Availability',              preview:'I can do Tue or Wed afternoon.', time:'Mar 12',    unread:false, body:"Hi,\n\nI can do Tue or Wed afternoon this week.\n\nAisha" },
];

export const INITIAL_AUDIT: AuditEntry[] = [
  { actor:'Mika S.', action:'Advanced Ruth Mlambo from Screening to Final Round', time:'12 min ago' },
  { actor:'System',  action:'AI CV analysis completed for Tawanda Moyo - 82',     time:'35 min ago' },
  { actor:'Ari K.',  action:'Scheduled interview for Linda Chipo - Mar 18 14:00', time:'1 hr ago'   },
  { actor:'Mika S.', action:'Posted new job: Software Developer (Junior)',        time:'2 hr ago'   },
  { actor:'System',  action:'Data export completed for March pipeline',           time:'Yesterday'  },
];

export const INITIAL_ACTIVITY: ActivityItem[] = [
  { color:'var(--green)',  text:'<strong>Ruth Mlambo</strong> moved to <strong>Final Round</strong>', time:'12 min ago' },
  { color:'var(--blue2)',  text:'<strong>New role</strong> published: <strong>Software Developer (Junior)</strong>', time:'2 hr ago' },
  { color:'var(--amber)',  text:'Scorecard submitted for <strong>Linda Chipo</strong> - 4.4/5', time:'1 hr ago' },
  { color:'var(--blue2)',  text:'<strong>9 new applications</strong> received for <strong>Backend Engineer</strong>', time:'3 hr ago' },
  { color:'var(--green)',  text:'<strong>Aisha Kelvin</strong> booked a technical interview', time:'Yesterday' },
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
  'Offer Letter':    'Dear [Name],\n\nWe are thrilled to offer you the position of [Role] at HireFlow.\n\nPlease review the attached offer letter and respond by [Date].\n\nWarm regards,\nRecruiting Team',
  'Rejection':       'Dear [Name],\n\nThank you for your interest in the [Role] position. After careful consideration we have decided to move forward with other candidates.\n\nBest regards,\nRecruiting Team',
  'Interview Invite':'Dear [Name],\n\nWe would like to invite you for a [Type] interview for the [Role] position.\n\nDate: [Date] - Time: [Time] - Format: Video call\n\nPlease confirm your availability.\n\nBest regards,\nRecruiting Team',
};
