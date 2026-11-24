import type { Profile } from './types';

export const profile: Profile = {
  name: 'Kushal Shrestha',
  shortName: 'kushal',
  role: 'CS student · data & AI · full stack',
  tagline:
    "Hi, I'm Kushal Shrestha — full-stack AI builder in St. Louis. I turn raw data into pipelines, and pipelines into products. Known bugs: none. Unknown bugs: TBD.",
  oneLiner: 'Kushal Shrestha, computer science student building data pipelines and AI products',
  resumeHeadline: 'Data engineering · AI/ML · full-stack · St. Louis, MO',
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
  manPage: { title: 'Portfolio Manual', section: 1 },
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
      "I'm a Computer Science student at Webster University in St. Louis (ML emphasis, 3.82 GPA, class of 2028). These days I build AI and full-stack projects, like Rant & Heal and SurgiPath. Before that I was a data engineering intern at Schnuck Markets, building Airflow and BigQuery pipelines. Along the way: a VS Code extension and a few hackathon projects. I like problems that sit between data and people, and I lead the Computer Science Club as its president.",
    ],
    short: [
      'CS student at Webster University in St. Louis (ML emphasis, 3.82 GPA, class of 2028).',
      'Now: building AI and full-stack projects (Rant & Heal, SurgiPath). Before: Airflow + BigQuery pipelines at Schnuck Markets.',
      'Looking for roles in AI, data, full-stack and DevOps.',
    ],
  },
  neofetch: [
    { label: 'Name', value: { ref: 'name' } },
    { label: 'Role', value: { ref: 'role' } },
    { label: 'Location', value: { ref: 'location' } },
    { label: 'Uptime', value: { ref: 'uptime' } },
    { label: 'Shell', value: 'portfolio-sh 1.0' },
    { label: 'Stack', value: 'Python · TypeScript · React · Next.js · BigQuery · Airflow · GCP' },
    { label: 'Building', value: 'Rant & Heal · SurgiPath' },
    { label: 'Learning', value: 'see ~/journey, updated daily' },
    { label: 'Contact', value: { ref: 'email' } },
  ],
  synopsisFlags: ['data', 'ml', 'fullstack', 'devops'],
};
