import { useEffect, useState } from 'react';
import {
  Button,
  Datagrid,
  DateField,
  EmailField,
  FunctionField,
  List,
  SearchInput,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
} from 'react-admin';
import {
  Button as MuiButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField as MuiTextField,
  Typography,
} from '@mui/material';
import { request } from '../api';

const userFilters = [
  <SearchInput source="search" alwaysOn key="search" />,
  <SelectInput
    source="subscriptionStatus"
    label="Subscription"
    key="subscriptionStatus"
    choices={[
      { id: 'ACTIVE', name: 'Active' },
      { id: 'EXPIRED', name: 'Expired' },
      { id: 'CANCELLED', name: 'Cancelled' },
      { id: 'SUSPENDED', name: 'Suspended' },
      { id: 'NONE', name: 'No plan' },
    ]}
  />,
  <SelectInput
    source="role"
    key="role"
    choices={[
      { id: 'USER', name: 'User' },
      { id: 'ADMIN', name: 'Admin' },
    ]}
  />,
];

export const UserList = () => (
  <List filters={userFilters} sort={{ field: 'createdAt', order: 'DESC' }} exporter={false}>
    <Datagrid bulkActionButtons={false} rowClick="show">
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <FunctionField
        label="Plan"
        render={(record: any) => record.subscription?.planName ?? '—'}
      />
      <FunctionField
        label="Status"
        render={(record: any) => record.subscription?.status ?? 'NONE'}
      />
      <DateField source="createdAt" label="Joined" />
    </Datagrid>
  </List>
);

/**
 * Granting a plan is the most important action in this panel: payments are admin-granted,
 * so this dialog is how a paying customer actually receives access.
 */
const GrantDialog = ({ userId, onDone }: { userId: string; onDone: () => void }) => {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<{ id: string; name: string; price: number; currency: string }[]>([]);
  const [planId, setPlanId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setOpen(true);
    try {
      const body = await request<{ items: any[] }>('/plans', { query: { limit: 100 } });
      setPlans(body.items ?? []);
      if (body.items?.length) setPlanId(body.items[0].id);
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await request(`/admin/users/${userId}/grants`, {
        method: 'POST',
        body: { planId, source: 'ADMIN_GRANT', note: note || undefined },
      });
      notify('Plan granted', { type: 'success' });
      setOpen(false);
      setNote('');
      onDone();
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button label="Grant a plan" onClick={load} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Grant a plan</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <MuiTextField
              select
              label="Plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              fullWidth
            >
              {plans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name} — {plan.currency} {plan.price}
                </MenuItem>
              ))}
            </MuiTextField>
            <MuiTextField
              label="Note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              helperText="Why this was granted — shown in the grant history."
            />
            <Typography variant="body2" color="text.secondary">
              Granting replaces any currently active plan for this user.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Cancel</MuiButton>
          <MuiButton onClick={submit} disabled={!planId || saving} variant="contained">
            {saving ? 'Granting…' : 'Grant'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * Cancel / suspend / reinstate / extend a grant.
 *
 * Every one of these needs a reason (the API requires it) and every one is
 * written into the grant's history, so an operator can later answer "why does
 * this person have access". Without these buttons a mis-grant could not be
 * undone at all: re-granting does not replace the old row, it burns another one.
 */
type GrantAction = 'cancel' | 'suspend' | 'reinstate' | 'extend';

const ACTION_COPY: Record<GrantAction, { title: string; verb: string; danger?: boolean }> = {
  cancel: { title: 'Cancel this plan', verb: 'Cancel plan', danger: true },
  suspend: { title: 'Suspend this plan', verb: 'Suspend', danger: true },
  reinstate: { title: 'Reinstate this plan', verb: 'Reinstate' },
  extend: { title: 'Extend this plan', verb: 'Extend' },
};

const GrantActionDialog = ({
  grant,
  action,
  onClose,
  onDone,
}: {
  grant: any;
  action: GrantAction | null;
  onClose: () => void;
  onDone: () => void;
}) => {
  const notify = useNotify();
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('30');
  const [expiresOn, setExpiresOn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!action) return;
    setReason('');
    setDays('30');
    // Reinstating needs an explicit new end date; default to a month out so the
    // operator adjusts rather than invents one from nothing.
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    setExpiresOn(soon.toISOString().slice(0, 10));
  }, [action]);

  if (!action) return null;
  const copy = ACTION_COPY[action];

  const submit = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { reason };
      // The API takes an absolute end date for both. "Extend by N days" is the
      // action an operator actually wants, so the date is computed from the
      // grant's current end rather than typed out.
      if (action === 'extend') {
        const end = new Date(grant.expiresOn);
        end.setDate(end.getDate() + Number(days));
        body.expiresOn = end.toISOString();
      }
      if (action === 'reinstate') body.expiresOn = new Date(expiresOn).toISOString();

      await request(`/admin/grants/${grant.id}/${action}`, { method: 'POST', body });
      notify(`${copy.verb} done`, { type: 'success' });
      onClose();
      onDone();
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {grant.plan?.name} · currently {grant.status} · ends{' '}
            {new Date(grant.expiresOn).toLocaleDateString()}
          </Typography>

          {action === 'extend' ? (
            <MuiTextField
              label="Extra days"
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              fullWidth
              helperText={
                Number(days)
                  ? `New end date: ${new Date(
                      new Date(grant.expiresOn).getTime() + Number(days) * 86400000,
                    ).toLocaleDateString()}`
                  : 'Added to the current end date.'
              }
            />
          ) : null}

          {action === 'reinstate' ? (
            <MuiTextField
              label="New end date"
              type="date"
              value={expiresOn}
              onChange={(e) => setExpiresOn(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          ) : null}

          <MuiTextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            helperText="Recorded against the grant. Required."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={onClose}>Close</MuiButton>
        <MuiButton
          onClick={submit}
          disabled={!reason.trim() || saving || (action === 'extend' && !Number(days))}
          variant="contained"
          color={copy.danger ? 'error' : 'primary'}
        >
          {saving ? 'Working…' : copy.verb}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

const GrantRow = ({ grant, onDone }: { grant: any; onDone: () => void }) => {
  const [action, setAction] = useState<GrantAction | null>(null);

  // Which actions make sense depends on where the grant is: you cannot cancel
  // something already cancelled, or reinstate something still running.
  const live = grant.status === 'ACTIVE';
  const suspended = grant.status === 'SUSPENDED';
  const finished = grant.status === 'CANCELLED' || grant.status === 'EXPIRED';

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Typography variant="body2" sx={{ minWidth: 320 }}>
        {grant.plan?.name} · {grant.status} · ends{' '}
        {new Date(grant.expiresOn).toLocaleDateString()}
        {grant.grantNote ? ` · ${grant.grantNote}` : ''}
      </Typography>

      {live ? <Button label="Extend" onClick={() => setAction('extend')} /> : null}
      {live ? <Button label="Suspend" onClick={() => setAction('suspend')} /> : null}
      {live || suspended ? <Button label="Cancel" onClick={() => setAction('cancel')} /> : null}
      {suspended || finished ? (
        <Button label="Reinstate" onClick={() => setAction('reinstate')} />
      ) : null}

      <GrantActionDialog
        grant={grant}
        action={action}
        onClose={() => setAction(null)}
        onDone={onDone}
      />
    </Stack>
  );
};

/**
 * Erasing an account, as opposed to hiding it.
 *
 * The panel's existing delete is a flag: the person disappears from lists but
 * their row, their posts and their weigh-ins stay in the database. This is the
 * other thing — the one to reach for when somebody has asked to be forgotten,
 * or a test account should stop existing. It cannot be undone, so the
 * administrator types the address rather than clicking twice, and the server
 * checks it against the record before acting.
 */
const DeleteForeverDialog = ({ record }: { record: any }) => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [working, setWorking] = useState(false);

  const email = String(record.email ?? '');
  const isAdmin = record.role === 'ADMIN';
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  const close = () => {
    setOpen(false);
    setTyped('');
  };

  const submit = async () => {
    setWorking(true);
    try {
      const res = await request<{
        removed: { posts: number; comments: number; weighIns: number; grants: number; photos: number };
        orphanedFiles: number;
      }>(`/admin/users/${record.id}/permanent-delete`, {
        method: 'POST',
        body: { confirmEmail: typed.trim() },
      });

      const { posts, comments, weighIns, grants } = res.removed;
      notify(
        `${email} deleted — ${posts} posts, ${comments} comments, ${weighIns} weigh-ins, ${grants} subscriptions.`,
        { type: 'success' },
      );
      if (res.orphanedFiles) {
        notify(`${res.orphanedFiles} image files could not be removed from storage.`, {
          type: 'warning',
        });
      }

      close();
      // The record no longer exists, so staying on its page would 404.
      redirect('list', 'users');
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <Button label="Delete permanently" onClick={() => setOpen(true)} sx={{ color: 'error.main' }} />

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>Delete {record.name || email} permanently?</DialogTitle>
        <DialogContent>
          {isAdmin ? (
            <Typography variant="body2" sx={{ mb: 2 }}>
              This account is an administrator and cannot be deleted. Change its role to User
              first, so losing your last administrator always takes two decisions.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                This removes the account from the database along with everything belonging to it —
                posts, comments, weigh-ins, saved recipes, photographs, notifications and
                subscription history. Their uploaded images are deleted from storage too.
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                There is no undo. To hide someone instead while keeping their data, use the
                ordinary delete, which can be reversed.
              </Typography>
              <MuiTextField
                label="Type the account's email to confirm"
                placeholder={email}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                fullWidth
                autoComplete="off"
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={close}>Cancel</MuiButton>
          <MuiButton
            onClick={submit}
            disabled={isAdmin || !matches || working}
            variant="contained"
            color="error"
          >
            {working ? 'Deleting…' : 'Delete permanently'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

const UserShowActions = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  if (!record) return null;
  return (
    <TopToolbar>
      <GrantDialog userId={record.id as string} onDone={refresh} />
      <DeleteForeverDialog record={record} />
    </TopToolbar>
  );
};

const GrantHistory = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const grants = (record?.grants ?? []) as any[];
  if (!grants.length) return <Typography variant="body2">—</Typography>;
  return (
    <Stack spacing={1}>
      {grants.map((grant) => (
        <GrantRow key={grant.id} grant={grant} onDone={refresh} />
      ))}
    </Stack>
  );
};

export const UserShow = () => (
  <Show actions={<UserShowActions />}>
    <SimpleShowLayout>
      <TextField source="name" />
      <EmailField source="email" />
      <TextField source="role" />
      <DateField source="createdAt" label="Joined" />

      <FunctionField
        label="Entitlement"
        render={(record: any) =>
          record.entitlement?.isActive
            ? `${record.entitlement.planName} — ${record.entitlement.daysRemaining} days left`
            : (record.entitlement?.status ?? 'NONE')
        }
      />

      <FunctionField label="Grant history" render={() => <GrantHistory />} />
    </SimpleShowLayout>
  </Show>
);
