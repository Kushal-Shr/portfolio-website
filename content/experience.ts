import type { Experience } from './types';

// Newest first by end date. Avenues Khabar (ends 2024-03) sits above the freelance gig (ends
// 2024-01) even though it started earlier, matching the resume order.
export const experience: readonly Experience[] = [
  {
    id: 'schnuck',
    commit: '7c41e9a',
    title: 'Data Engineering Intern',
    titleNote: 'year-round',
    org: 'Schnuck Markets, Inc.',
    orgShort: 'Schnuck Markets',
    start: '2025-05',
    end: '2026-09',
    location: 'St. Louis, MO',
    workMode: 'Hybrid',
    bullets: [
      'Built Python data pipelines in Airflow: FastAPI in, BigQuery out',
      'Built 2 data agents and automated workflows on Agent Engine, lifting operational efficiency 20%',
      'Migrated 10+ datasets from Oracle to BigQuery with automated Talend ETL jobs',
      'Cleansed 3 core legacy datasets by refactoring stored procedures: 100% data quality',
    ],
    summary:
      'Airflow pipelines, 2 data agents (+20% efficiency), Oracle to BigQuery migration of 10+ datasets.',
    stack: ['python', 'airflow', 'fastapi', 'bigquery', 'oracle', 'talend', 'agent engine'],
  },
  {
    id: 'amigo',
    commit: '2d90b5f',
    title: 'Frontend Software Engineering Intern',
    org: 'Amigo Groups',
    start: '2024-03',
    end: '2024-06',
    workMode: 'Remote',
    bullets: [
      'Built OAuth 2.0 authentication flows to protect backend data endpoints',
      'Grew a React.js blog site past 300 daily visitors',
    ],
    summary: 'OAuth 2.0 flows for backend endpoints; a React.js blog past 300 daily visitors.',
    resumeBullets: [
      'Built OAuth 2.0 authentication flows to protect backend data endpoints',
      'Grew a React.js blog past 300 daily visitors',
    ],
    stack: ['react.js', 'oauth 2.0'],
  },
  {
    id: 'avenues',
    commit: '9ae3c10',
    title: 'Website Management Intern',
    org: 'Avenues Khabar',
    start: '2023-09',
    end: '2024-03',
    location: 'Kathmandu, Nepal',
    bullets: [
      'Cut load times 30% through defect tracking, testing and UI optimization',
      'Drove a 40% engagement increase by analyzing traffic datasets and tuning the front end',
    ],
    summary: '30% faster load times and a 40% engagement increase.',
    resumeBullets: [
      'Cut load times 30% through defect tracking, testing and UI optimization',
      'Drove a 40% engagement increase from traffic analysis and front-end changes',
    ],
    stack: ['front-end optimization', 'testing', 'traffic analytics'],
  },
  {
    id: 'freelance',
    commit: '51f7d28',
    title: 'Data Science Instructor',
    org: 'Freelance',
    start: '2023-11',
    end: '2024-01',
    location: 'Kathmandu, Nepal',
    bullets: [
      'Raised student grades 35% with tailored instructional plans in Python, data analysis and MySQL',
    ],
    summary: '35% grade improvement with tailored Python, data analysis and MySQL plans.',
    resumeBullets: [
      'Raised student grades 35% with tailored plans in Python, data analysis, MySQL',
    ],
    stack: ['python', 'data analysis', 'mysql'],
  },
];
