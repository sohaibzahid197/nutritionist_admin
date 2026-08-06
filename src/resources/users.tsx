import { useState } from 'react';
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
    <Datagrid rowClick="show">
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

const UserShowActions = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  if (!record) return null;
  return (
    <TopToolbar>
      <GrantDialog userId={record.id as string} onDone={refresh} />
    </TopToolbar>
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

      <FunctionField
        label="Grant history"
        render={(record: any) =>
          (record.grants ?? []).length ? (
            <Stack spacing={0.5}>
              {record.grants.map((grant: any) => (
                <Typography key={grant.id} variant="body2">
                  {grant.plan?.name} · {grant.status} · expires{' '}
                  {new Date(grant.expiresOn).toLocaleDateString()}
                  {grant.grantNote ? ` · ${grant.grantNote}` : ''}
                </Typography>
              ))}
            </Stack>
          ) : (
            '—'
          )
        }
      />
    </SimpleShowLayout>
  </Show>
);
