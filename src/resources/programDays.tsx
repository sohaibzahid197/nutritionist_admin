import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotify, useRecordContext, useRefresh } from 'react-admin';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { request } from '../api';

type Combo = { id: string; name: string; recipes?: { recipe?: { name?: string } }[] };
type DayRow = { day: number; comboId: string | null; comboName: string | null };

const comboSummary = (combo?: Combo) => {
  const names = (combo?.recipes ?? []).map((r) => r.recipe?.name).filter(Boolean);
  return names.length ? names.join(' · ') : 'No recipes yet';
};

export const ProgramDayMapper = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  const [combos, setCombos] = useState<Combo[]>([]);
  const [days, setDays] = useState<DayRow[]>([]);
  const [saving, setSaving] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkCombo, setBulkCombo] = useState('');

  const programId = record?.id as string | undefined;
  const totalDays = Number(record?.totalDays ?? 0);

  /**
 * Every combo, not the first hundred.
 *
 * The picker used to request `limit: 100` — which is also the API's hard
 * maximum — so combo 101 could never be assigned to a day, with nothing on
 * screen to say so. Paging is the only way to stay correct as the library
 * grows; the loop is bounded by `total` so it cannot spin.
 */
const COMBO_PAGE = 100;

const fetchAllCombos = async (): Promise<Combo[]> => {
  const out: Combo[] = [];
  for (let page = 1; ; page += 1) {
    const body = await request<{ items: Combo[]; total?: number }>('/combos', {
      query: { page, limit: COMBO_PAGE },
    });
    const items = body.items ?? [];
    out.push(...items);
    const total = typeof body.total === 'number' ? body.total : out.length;
    if (items.length < COMBO_PAGE || out.length >= total) return out;
  }
};

const buildDays = useCallback((program: any, total: number): DayRow[] => {
    const mapped = new Map<number, any>();
    for (const row of program?.programComboDays ?? []) mapped.set(row.day, row);
    return Array.from({ length: total }, (_, i) => {
      const day = i + 1;
      const row = mapped.get(day);
      return {
        day,
        comboId: row?.comboId ?? null,
        comboName: row?.combo?.name ?? null,
      };
    });
  }, []);

  const load = useCallback(async () => {
    if (!programId || !totalDays) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [combos, program] = await Promise.all([
        fetchAllCombos(),
        request<any>(`/programs/${programId}`),
      ]);
      setCombos(combos);
      setDays(buildDays(program, totalDays));
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [programId, totalDays, buildDays, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const missing = useMemo(() => days.filter((d) => !d.comboId).map((d) => d.day), [days]);

  const setDay = async (day: number, comboId: string) => {
    if (!programId) return;
    setSaving(day);
    try {
      if (comboId) {
        await request(`/programs/${programId}/days/${day}`, {
          method: 'PUT',
          body: { comboId },
        });
      } else {
        await request(`/programs/${programId}/days/${day}`, { method: 'DELETE' });
      }
      const combo = combos.find((c) => c.id === comboId);
      setDays((prev) =>
        prev.map((d) =>
          d.day === day
            ? { ...d, comboId: comboId || null, comboName: combo?.name ?? null }
            : d,
        ),
      );
      return true;
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
      return false;
    } finally {
      setSaving(null);
    }
  };

  /**
   * Reports what actually happened. This used to announce the full count as
   * filled no matter what: each write swallowed its own error, so a run that
   * failed halfway still ended with a success toast and a programme the author
   * believed was complete.
   */
  const fillEmpty = async () => {
    if (!bulkCombo || !programId) return;
    const targets = days.filter((d) => !d.comboId).map((d) => d.day);
    const failed: number[] = [];

    for (const day of targets) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await setDay(day, bulkCombo);
      if (!ok) failed.push(day);
    }

    const filled = targets.length - failed.length;
    if (failed.length) {
      notify(
        `Filled ${filled} of ${targets.length}. Day${failed.length === 1 ? '' : 's'} ${failed.join(', ')} failed.`,
        { type: 'warning' },
      );
    } else {
      notify(`Filled ${filled} empty day${filled === 1 ? '' : 's'}`, { type: 'success' });
    }
    refresh();
  };

  if (!programId) return null;

  if (!totalDays) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Set a length for this programme and save, then map each day to a combo.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!combos.length) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        There are no combos yet. A combo is one day of food; create some before mapping days.
      </Alert>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6">Day mapping</Typography>
        <Chip
          size="small"
          label={
            missing.length
              ? `${totalDays - missing.length}/${totalDays} mapped`
              : `All ${totalDays} days mapped`
          }
          color={missing.length ? 'warning' : 'success'}
        />
      </Stack>

      {missing.length ? (
        <Alert severity="warning">
          Days {missing.slice(0, 12).join(', ')}
          {missing.length > 12 ? `, +${missing.length - 12} more` : ''} have no combo. Subscribers
          generated over an unmapped day get nothing to eat on it, and it is never backfilled.
        </Alert>
      ) : (
        <Alert severity="success">
          Every day is mapped. This programme can be attached to a plan and sold.
        </Alert>
      )}

      {missing.length ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Fill every empty day with"
              value={bulkCombo}
              onChange={(e) => setBulkCombo(e.target.value)}
              sx={{ minWidth: 260 }}
            >
              {combos.map((combo) => (
                <MenuItem key={combo.id} value={combo.id}>
                  {combo.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              disabled={!bulkCombo || saving !== null}
              onClick={fillEmpty}
            >
              Fill {missing.length} empty day{missing.length === 1 ? '' : 's'}
            </Button>
            <Typography variant="body2" color="text.secondary">
              A starting point for a long programme. Vary the days afterwards.
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      <Stack spacing={1}>
        {days.map((row) => {
          const combo = combos.find((c) => c.id === row.comboId);
          return (
            <Paper
              key={row.day}
              variant="outlined"
              sx={{
                p: 1.5,
                borderColor: row.comboId ? undefined : 'warning.main',
                backgroundColor: row.comboId ? undefined : 'warning.50',
              }}
            >
              <Stack
                direction="row"
                spacing={2}
                sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Typography variant="subtitle2" sx={{ minWidth: 64 }}>
                  Day {row.day}
                </Typography>

                <TextField
                  select
                  size="small"
                  value={row.comboId ?? ''}
                  onChange={(e) => setDay(row.day, e.target.value)}
                  disabled={saving === row.day}
                  sx={{ minWidth: 260 }}
                >
                  <MenuItem value="">
                    <em>Not mapped</em>
                  </MenuItem>
                  {combos.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>

                {saving === row.day ? <CircularProgress size={16} /> : null}

                <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                  {row.comboId ? comboSummary(combo) : 'Nothing planned for this day'}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default ProgramDayMapper;
