import type { Profile } from './types';

export const profile: Profile = {
  name: 'Kushal Shrestha',
  shortName: 'kushal',
  role: 'CS student · data & AI',
  tagline: "Hi, I'm Kushal Shrestha — I build data pipelines and AI products in St. Louis.",
  oneLiner: 'Kushal Shrestha, computer science student building data pipelines and AI products',
  resumeHeadline: 'Data engineering · AI/ML · full-stack · St. Louis, MO',
  resumeSummary:
    'CS student (ML emphasis, GPA 3.82) who builds data pipelines and AI products: Airflow and BigQuery at Schnuck Markets, LLM apps on Next.js, and three competition wins.',
  location: 'St. Louis, MO',
  timezone: 'CT',
  openTo: ['AI', 'data', 'full-stack', 'devops'],
  email: 'kushalshrestha@webster.edu',
  links: {
    github: {
      href: 'https://github.com/Kushal-Shr',
      label: 'github.com/Kushal-Shr',
      handle: 'Kushal-Shr',
    },
    linkedin: {
      href: 'https://www.linkedin.com/in/kushal-shrestha-28350927b/',
      label: 'linkedin.com/in/kushal-shrestha-28350927b',
      handle: 'kushal-shrestha',
    },
  },
  resume: { href: '/resume.pdf', label: 'resume.pdf' },
  manPage: { title: 'Portfolio Manual', section: 1, date: 'November 2026' },
  education: {
    school: 'Webster University',
    degree: 'Bachelor of Science in Computer Science',
    degreeShort: 'B.S. Computer Science',
    emphasis: 'Machine Learning',
    emphasisShort: 'ML',
    start: '2024',
    end: '2028',
    gpa: 3.82,
  },
  about: {
    paragraphs: [
      "I'm a Computer Science student at Webster University in St. Louis (ML emphasis, 3.82 GPA, class of 2028). I build data pipelines and AI-powered products: Airflow and BigQuery work at Schnuck Markets, plus LLM apps, a VS Code extension and a few hackathon projects on the side. I like problems that sit between data and people, and I lead the Computer Science Club as its president.",
    ],
    short: [
      'CS student at Webster University in St. Louis (ML emphasis, 3.82 GPA, class of 2028).',
      'I build data pipelines and AI products: Airflow + BigQuery at Schnuck Markets, LLM apps, a VS Code extension, hackathon projects.',
      'Looking for roles in AI, data, full-stack and DevOps.',
    ],
  },
  neofetch: [
    { label: 'Name', value: { ref: 'name' } },
    { label: 'Role', value: { ref: 'role' } },
    { label: 'Location', value: { ref: 'location' } },
    { label: 'Uptime', value: { ref: 'uptime' } },
    { label: 'Shell', value: 'portfolio-sh 1.0' },
    { label: 'Stack', value: 'Python · TypeScript · BigQuery' },
    { label: 'Building', value: 'this portfolio + AI side projects' },
    { label: 'Learning', value: 'see ~/journey, updated daily' },
    { label: 'Contact', value: { ref: 'email' } },
  ],
  synopsisFlags: ['data', 'ml', 'fullstack', 'devops'],
};
