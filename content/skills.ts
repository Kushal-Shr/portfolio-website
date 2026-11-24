import type { SkillGroup } from './types';

// The man page and the resume split "languages & web" into two lists, so each list is modelled
// separately and the skills page merges the two.
export const skillGroups: readonly SkillGroup[] = [
  {
    key: 'languages',
    title: 'languages & web',
    resumeLabel: 'Languages & Web',
    lists: [
      {
        key: 'languages',
        flag: 'l',
        packages: ['SQL', 'Python', 'C++', 'TypeScript', 'JavaScript'],
      },
      {
        key: 'web',
        flag: 'w',
        packages: ['React', 'Next.js', 'Node.js', 'Flask', 'Tailwind CSS'],
      },
    ],
    alsoUsed: ['React Native', 'Streamlit', 'p5.js'],
  },
  {
    key: 'ai-data',
    title: 'ai & data',
    resumeLabel: 'AI & Data Engineering',
    lists: [
      {
        key: 'ai-data',
        flag: 'a',
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
    resumeLabel: 'Cloud, DevOps & Tools',
    lists: [
      {
        key: 'cloud',
        flag: 'c',
        packages: ['AWS', 'GCP', 'REST APIs', 'Git', 'Kubernetes', 'Jenkins', 'Firebase', 'WebRTC'],
      },
    ],
    alsoUsed: ['OAuth 2.0'],
  },
];
