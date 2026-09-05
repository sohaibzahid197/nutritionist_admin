import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Alert, Divider } from '@mui/material';
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOffIcon from '@mui/icons-material/PersonOffOutlined';
import CheckIcon from '@mui/icons-material/TaskAltOutlined';
import FlagIcon from '@mui/icons-material/FlagOutlined';
import RestaurantIcon from '@mui/icons-material/RestaurantOutlined';
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined';
import BoltIcon from '@mui/icons-material/BoltOutlined';
import { Title } from 'react-admin';
import { request } from './api';
import { T } from './theme';

/**
 * The API has served `/admin/dashboard` since the panel was built, and nothing
 * ever called it: staff landed on the Users list with no read on the business.
 * This shows the numbers that answer "is the product working today" — is content
 * reaching subscribers, is the nightly generation still running, is anything
 * waiting on a human.
 */

type Dashboard = {
  totalUsers: number;
  activeSubscribedUsers: number;
  nonSubscribedUsers: number;
  recipes: number;
  programs: number;
  openReports: number;
  lastGeneration: {
    status: string;
    finishedAt: string | null;
    error: string | null;
    summary?: { unmappedDays?: unknown[]; shortDays?: unknown[] } | null;
  } | null;
  mealTracking: {
    adherencePct: number;
    eatenMeals: number;
    plannedMealsToDate: number;
    weekStart: string;
    weekEnd: string;
  } | null;
};

const Stat = ({ label, value, hint, tone, icon, bar }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'plain' | 'warn' | 'good';
  icon: React.ReactNode;
  /** 0-100. Draws a progress rule under the number when the figure is a share of something. */
  bar?: number;
}) => {
  const accent = tone === 'warn' ? T.danger : tone === 'good' ? T.acc : T.ink;
  return (
    <Card
      sx={{
        flex: '1 1 210px',
        minWidth: 210,
        borderColor: T.line,
        // The stripe carries the state, so a problem is visible before the
        // number is read.
        borderTop: `3px solid ${tone === 'warn' ? T.danger : tone === 'good' ? T.acc : T.line}`,
      }}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
          <Box
            sx={{
              width: 30, height: 30, borderRadius: '8px',
              display: 'grid', placeItems: 'center',
              bgcolor: tone === 'warn' ? '#F7E7E2' : T.accBg,
              color: tone === 'warn' ? T.danger : T.accLt,
              '& svg': { fontSize: 17 },
            }}
          >
            {icon}
          </Box>
          <Typography
            sx={{ color: T.mute, textTransform: 'uppercase', letterSpacing: '.07em', fontSize: 10.5, fontWeight: 600 }}
          >
            {label}
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 34, lineHeight: 1.05, color: accent, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>

        {typeof bar === 'number' ? (
          <Box sx={{ mt: 1.25, height: 4, borderRadius: 2, bgcolor: T.well, overflow: 'hidden' }}>
            <Box sx={{ width: `${Math.max(2, Math.min(100, bar))}%`, height: '100%', bgcolor: accent }} />
          </Box>
        ) : null}

        {hint ? (
          <Typography variant="body2" sx={{ color: T.dim, mt: typeof bar === 'number' ? 0.75 : 0.5 }}>
            {hint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

/** A quiet rule with a word on it, so the tiles below read as a set. */
const GroupLabel = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3.5, mb: 1.5 }}>
    <Typography
      sx={{ color: T.mute, textTransform: 'uppercase', letterSpacing: '.09em', fontSize: 10.5, fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {children}
    </Typography>
    <Divider sx={{ flex: 1, borderColor: T.line }} />
  </Box>
);

const relative = (iso: string | null) => {
  if (!iso) return 'never';
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return 'under an hour ago';
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
};

export default function Dashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let live = true;
    request<Dashboard>('/admin/dashboard')
      .then((d) => { if (live) setData(d); })
      .catch((e) => { if (live) setError(e as Error); });
    return () => { live = false; };
  }, []);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Title title="Overview" />
        <Alert severity="error">Could not load the overview: {error.message}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 2 }}>
        <Title title="Overview" />
        <LinearProgress />
      </Box>
    );
  }

  const gen = data.lastGeneration;
  // A generation that has not run since yesterday means tomorrow's meals may
  // not exist. It is the one number worth alarming on.
  const genStale =
    !gen?.finishedAt || Date.now() - new Date(gen.finishedAt).getTime() > 26 * 3_600_000;
  const unmapped = gen?.summary?.unmappedDays?.length ?? 0;
  const meals = data.mealTracking;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 }, pb: 6, maxWidth: 1180 }}>
      <Title title="Overview" />

      {genStale ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Plan-day generation last succeeded {relative(gen?.finishedAt ?? null)}. Subscribers may be
          missing meals — check the scheduled job.
        </Alert>
      ) : null}

      {unmapped ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The last generation found {unmapped} programme day{unmapped === 1 ? '' : 's'} with no combo
          mapped. Those days produce no meals until they are filled in.
        </Alert>
      ) : null}

      <GroupLabel>People</GroupLabel>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Stat
          icon={<PeopleIcon />}
          label="Subscribers"
          value={data.activeSubscribedUsers}
          hint={`${data.totalUsers} accounts total`}
          tone="good"
          bar={data.totalUsers ? (data.activeSubscribedUsers / data.totalUsers) * 100 : 0}
        />
        <Stat
          icon={<PersonOffIcon />}
          label="No plan"
          value={data.nonSubscribedUsers}
          hint="signed up, not subscribed"
        />
        <Stat
          icon={<CheckIcon />}
          label="Adherence this week"
          value={meals ? `${meals.adherencePct}%` : '—'}
          hint={meals ? `${meals.eatenMeals} of ${meals.plannedMealsToDate} meals ticked` : 'no plan days yet'}
          bar={meals?.adherencePct}
        />
        <Stat
          icon={<FlagIcon />}
          label="Open reports"
          value={data.openReports}
          hint={data.openReports ? 'waiting on a decision' : 'nothing to moderate'}
          tone={data.openReports ? 'warn' : 'plain'}
        />
      </Box>

      <GroupLabel>Content and delivery</GroupLabel>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Stat icon={<RestaurantIcon />} label="Recipes" value={data.recipes} hint="in the library" />
        <Stat icon={<CalendarIcon />} label="Programmes" value={data.programs} hint="published plans" />
        <Stat
          icon={<BoltIcon />}
          label="Last generation"
          value={gen?.status === 'SUCCESS' ? 'OK' : (gen?.status ?? 'never run')}
          hint={relative(gen?.finishedAt ?? null)}
          tone={genStale || gen?.status !== 'SUCCESS' ? 'warn' : 'good'}
        />
      </Box>
    </Box>
  );
}
