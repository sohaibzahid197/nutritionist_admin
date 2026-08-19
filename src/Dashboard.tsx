import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, LinearProgress, Alert } from '@mui/material';
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

const Stat = ({ label, value, hint, tone }: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'plain' | 'warn';
}) => (
  <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
    <CardContent>
      <Typography variant="body2" sx={{ color: T.mute, textTransform: 'uppercase', letterSpacing: '.06em', fontSize: 11 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 30, lineHeight: 1.2, color: tone === 'warn' ? T.danger : T.ink }}>
        {value}
      </Typography>
      {hint ? <Typography variant="body2" sx={{ color: T.dim, mt: 0.5 }}>{hint}</Typography> : null}
    </CardContent>
  </Card>
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
    <Box sx={{ p: 2 }}>
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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Stat label="Subscribers" value={data.activeSubscribedUsers} hint={`${data.totalUsers} accounts total`} />
        <Stat label="No plan" value={data.nonSubscribedUsers} hint="signed up, not subscribed" />
        <Stat
          label="Adherence this week"
          value={meals ? `${meals.adherencePct}%` : '—'}
          hint={meals ? `${meals.eatenMeals} of ${meals.plannedMealsToDate} meals ticked` : undefined}
        />
        <Stat
          label="Open reports"
          value={data.openReports}
          hint={data.openReports ? 'waiting on a decision' : 'nothing to moderate'}
          tone={data.openReports ? 'warn' : 'plain'}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Stat label="Recipes" value={data.recipes} hint="in the library" />
        <Stat label="Programmes" value={data.programs} hint="published plans" />
        <Stat
          label="Last generation"
          value={gen?.status === 'SUCCESS' ? 'OK' : (gen?.status ?? 'never run')}
          hint={relative(gen?.finishedAt ?? null)}
          tone={genStale || gen?.status !== 'SUCCESS' ? 'warn' : 'plain'}
        />
      </Box>
    </Box>
  );
}
