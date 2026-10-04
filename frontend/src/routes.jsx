import {
  SquaresFourIcon,
  ListChecksIcon,
  BooksIcon,
  CalendarBlankIcon,
  ArrowsCounterClockwiseIcon,
  ChartLineUpIcon,
  LightbulbFilamentIcon,
  GearSixIcon,
} from '@phosphor-icons/react';

/**
 * Single source of truth for navigation. The sidebar, the mobile drawer and
 * the router all read this, so a page can never exist in one and not another.
 */
export const NAV_GROUPS = [
  {
    label: 'Daily',
    items: [
      { to: '/app', label: 'Dashboard', icon: SquaresFourIcon, end: true },
      { to: '/app/today', label: "Today's plan", icon: ListChecksIcon },
    ],
  },
  {
    label: 'Syllabus',
    items: [
      { to: '/app/subjects', label: 'Subjects', icon: BooksIcon },
      { to: '/app/calendar', label: 'Calendar', icon: CalendarBlankIcon },
      { to: '/app/revision', label: 'Revision', icon: ArrowsCounterClockwiseIcon },
    ],
  },
  {
    label: 'Insight',
    items: [
      { to: '/app/progress', label: 'Progress', icon: ChartLineUpIcon },
      { to: '/app/insights', label: 'Study insights', icon: LightbulbFilamentIcon },
    ],
  },
];

export const SETTINGS_ITEM = { to: '/app/settings', label: 'Settings', icon: GearSixIcon };

export const ALL_NAV = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];
