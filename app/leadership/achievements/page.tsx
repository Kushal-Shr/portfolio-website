import type { Metadata } from 'next';
import { PageTrail } from '@/components/detail/PageTrail';
import { AchievementRows } from '@/components/leadership/AchievementRows';
import { Box } from '@/components/terminal/Box';
import { TerminalPage } from '@/components/terminal/TerminalPage';
import { achievements } from '@/content/achievements';
import { trailFor } from '@/lib/detail';
import { loadSiteTree } from '@/lib/site-load';
import { routeDescriptions } from '@/lib/seo/copy';
import { pageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = pageMetadata({
  title: 'achievements',
  description: routeDescriptions.achievements,
  path: '/leadership/achievements/',
});

export default async function AchievementsPage() {
  return (
    <TerminalPage prompt="ls -l achievements" promptPath="~/leadership">
      <h1 className="text-[20px] font-bold">achievements</h1>
      <Box title="ls ~/achievements" tone="yellow" className="px-[22px] pt-6 pb-[18px]">
        <AchievementRows achievements={achievements} />
      </Box>
      <PageTrail
        trail={{
          ...trailFor(await loadSiteTree(), '~/leadership/achievements'),
          prev: undefined,
          next: undefined,
        }}
      />
    </TerminalPage>
  );
}
