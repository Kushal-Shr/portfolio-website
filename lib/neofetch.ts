import { experience } from '@/content/experience';
import { profile } from '@/content/profile';
import { yearsSince } from './format';

/** Resolves the profile's neofetch rows, expanding references to other profile fields. */
export function neofetchRows(now: Date): { label: string; value: string }[] {
  const earliest = experience.map((e) => e.start).sort()[0] ?? '';
  const refs = {
    name: profile.name,
    role: profile.role,
    location: profile.location,
    email: profile.email,
    uptime: `${yearsSince(earliest, now)} years shipping software`,
  };
  return profile.neofetch.map((row) => ({
    label: row.label,
    value: typeof row.value === 'string' ? row.value : refs[row.value.ref],
  }));
}
