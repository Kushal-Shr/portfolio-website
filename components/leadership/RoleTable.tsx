import Link from 'next/link';
import { ScrollX } from '@/components/terminal/ScrollX';
import type { LeadershipRole } from '@/content/types';

const COLUMNS = ['PID', 'ROLE', 'ORG', 'SCOPE', 'STAT', 'STATUS'];

type RoleTableProps = {
  roles: readonly LeadershipRole[];
  /** Link each ROLE cell to its page (off on the role's own page). */
  linkRoles?: boolean;
};

const CAPTION = "ps aux --leadership · roles I've taken on outside my day job";

function RoleName({ role, link }: { role: LeadershipRole; link: boolean }) {
  return (
    <span className="font-bold">
      {link ? (
        <Link href={`/leadership/${role.slug}/`} className="link-quiet">
          {role.role}
        </Link>
      ) : (
        role.role
      )}
    </span>
  );
}

function Status({ role }: { role: LeadershipRole }) {
  return (
    <span className={role.status.tone === 'running' ? 'text-green' : 'text-fg-dim'}>
      {role.status.text}
    </span>
  );
}

/**
 * The `ps aux` table, shared by the leadership page and each role's page. Six columns do not fit
 * a phone, so there each process is a stacked card with the same fields and the table is hidden.
 */
export function RoleTable({ roles, linkRoles = true }: RoleTableProps) {
  return (
    <>
      <div className="sm:hidden">
        <p className="text-fg-dim pb-2">{CAPTION}</p>
        <ul className="border-line m-0 list-none border-t p-0">
          {roles.map((l) => (
            <li key={l.pid} className="border-line border-b py-3">
              <p className="flex items-baseline gap-[2ch]">
                <span className="text-fg-dim">{l.pid}</span>
                <RoleName role={l} link={linkRoles} />
              </p>
              <dl className="m-0 mt-1 grid grid-cols-[7ch_minmax(0,1fr)] gap-x-[1ch] pl-[5ch]">
                <dt className="text-fg-dim">org</dt>
                <dd className="m-0">{l.org}</dd>
                <dt className="text-fg-dim">scope</dt>
                <dd className="m-0">{l.scope}</dd>
                <dt className="text-fg-dim">stat</dt>
                <dd className="m-0">
                  {l.stat} · <Status role={l} />
                </dd>
              </dl>
            </li>
          ))}
        </ul>
      </div>
      <RoleGrid roles={roles} linkRoles={linkRoles} />
    </>
  );
}

function RoleGrid({ roles, linkRoles }: Required<RoleTableProps>) {
  return (
    <ScrollX label="leadership roles table" className="max-sm:hidden">
      <table className="w-full min-w-[720px] border-collapse">
        <caption className="text-fg-dim pb-2 text-left">{CAPTION}</caption>
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
                <RoleName role={l} link={linkRoles} />
              </td>
              <td className="py-2 pr-4 align-top">{l.org}</td>
              <td className="py-2 pr-4 align-top">{l.scope}</td>
              <td className="py-2 pr-4 align-top">{l.stat}</td>
              <td className="py-2 pr-4 align-top">
                <Status role={l} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollX>
  );
}
