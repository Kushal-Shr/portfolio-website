import type { Learning, SkillGroup } from './types';

// The man page and the resume split "languages & web" into two lists, so each list is modelled
// separately and the skills page merges the two.
export const skillGroups: readonly SkillGroup[] = [
  {
    key: 'languages',
    title: 'languages & web',
    lists: [
      {
        key: 'languages',
        flag: 'l',
        resumeLabel: 'Languages',
        packages: ['SQL', 'Python', 'C++', 'TypeScript', 'JavaScript'],
      },
      {
        key: 'web',
        flag: 'w',
        resumeLabel: 'Web',
        packages: ['React', 'Next.js', 'Node.js', 'Flask', 'Tailwind CSS'],
      },
    ],
    alsoUsed: ['React Native', 'Streamlit', 'p5.js'],
  },
  {
    key: 'ai-data',
    title: 'ai & data',
    lists: [
      {
        key: 'ai-data',
        flag: 'a',
        resumeLabel: 'AI & Data',
        packages: [
          'LLM',
          'scikit-learn',
          'TensorFlow',
          'Data Modeling',
          'BigQuery',
          'Apache Airflow',
          'Talend',
        ],
      },
    ],
    alsoUsed: ['Gemini', 'RAG', 'OpenCV', 'Oracle', 'FastAPI'],
  },
  {
    key: 'cloud',
    title: 'cloud, devops & tools',
    lists: [
      {
        key: 'cloud',
        flag: 'c',
        resumeLabel: 'Cloud & Tools',
        packages: ['AWS', 'GCP', 'REST APIs', 'Git', 'Kubernetes', 'Jenkins', 'Firebase', 'WebRTC'],
      },
    ],
    alsoUsed: ['OAuth 2.0'],
  },
];

export const learning: readonly Learning[] = [
  {
    name: 'Agent Engine + data agents',
    shortName: 'Agent Engine',
    note: 'built 2 at Schnuck Markets, going deeper',
  },
  {
    name: 'machine learning',
    shortName: 'machine learning',
    note: 'B.S. CS with an ML emphasis, through 2028',
  },
];
