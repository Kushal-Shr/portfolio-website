import Link from 'next/link';
import type { LeadershipRole } from '@/content/types';

const COLUMNS = ['PID', 'ROLE', 'ORG', 'SCOPE', 'STAT', 'STATUS'];

type RoleTableProps = {
  roles: readonly LeadershipRole[];
  /** Link each ROLE cell to its page (off on the role's own page). */
  linkRoles?: boolean;
};

/** The `ps aux` table, shared by the leadership page and each role's page. */
export function RoleTable({ roles, linkRoles = true }: RoleTableProps) {
  return (
    <table className="w-full border-collapse">
      <caption className="text-fg-dim pb-2 text-left">
        ps aux --leadership · roles I&apos;ve taken on outside my day job
      </caption>
      <thead>
        <tr className="bg-green">
          {COLUMNS.map((col, i) => (
            <th
              key={col}
              scope="col"
              className={`text-bg py-1.5 pr-4 text-left font-bold ${i === 0 ? 'pl-2.5' : 'pl-0'}`}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {roles.map((l) => (
          <tr key={l.pid} className="border-line border-b">
            <td className="text-fg-dim py-2 pr-4 pl-2.5">{l.pid}</td>
            <td className="py-2 pr-4 align-top">
              <span className="font-bold">
                {linkRoles ? (
                  <Link href={`/leadership/${l.slug}/`} className="link-quiet">
                    {l.role}
                  </Link>
                ) : (
                  l.role
                )}
              </span>
            </td>
            <td className="py-2 pr-4 align-top">{l.org}</td>
            <td className="py-2 pr-4 align-top">{l.scope}</td>
            <td className="py-2 pr-4 align-top">{l.stat}</td>
            <td className="py-2 pr-4 align-top">
              <span className={l.status.tone === 'running' ? 'text-green' : 'text-fg-dim'}>
                {l.status.text}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
