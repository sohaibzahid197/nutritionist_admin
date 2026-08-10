import { useState } from 'react';
import {
  Button,
  Datagrid,
  DateField,
  FunctionField,
  List,
  TextField,
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
  Stack,
  Typography,
} from '@mui/material';
import { request } from '../api';

/**
 * Reported posts.
 *
 * Apple requires apps with user-generated content to provide a way to report
 * offensive material *and* to act on those reports. The API has had both ends of
 * this since the start; this is the missing middle.
 *
 * The list only ever contains unresolved reports (`resolvedAt: null` server
 * side), and blocking a post resolves every report against it — so acting on one
 * row clears the queue for that post rather than leaving duplicates behind.
 */

const BlockButton = ({ blocked }: { blocked: boolean }) => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!record?.post) return null;
  const post = record.post as any;

  const submit = async () => {
    setSaving(true);
    try {
      await request(`/admin/posts/${post.id}/blocked`, {
        method: 'POST',
        body: { isBlocked: blocked },
      });
      notify(blocked ? 'Post blocked and reports resolved' : 'Post restored', {
        type: 'success',
      });
      setOpen(false);
      refresh();
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button label={blocked ? 'Block post' : 'Restore'} onClick={() => setOpen(true)} />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{blocked ? 'Block this post?' : 'Restore this post?'}</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>{post.user?.name ?? 'Member'}</strong> — “{post.caption}”
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {blocked
                ? 'The post is hidden from every feed and all reports against it are marked resolved.'
                : 'The post becomes visible again. Existing reports stay resolved.'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Close</MuiButton>
          <MuiButton
            onClick={submit}
            disabled={saving}
            variant="contained"
            color={blocked ? 'error' : 'primary'}
          >
            {saving ? 'Working…' : blocked ? 'Block' : 'Restore'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const ReportList = () => (
  <List
    sort={{ field: 'createdAt', order: 'DESC' }}
    exporter={false}
    empty={
      <Typography sx={{ p: 3 }} color="text.secondary">
        Nothing reported. This queue only shows reports that have not been acted on.
      </Typography>
    }
  >
    <Datagrid bulkActionButtons={false}>
      <FunctionField
        label="Post"
        render={(record: any) => record.post?.caption ?? '—'}
      />
      <FunctionField
        label="Author"
        render={(record: any) => record.post?.user?.name ?? '—'}
      />
      <FunctionField
        label="Reported by"
        render={(record: any) => record.reportedBy?.name ?? '—'}
      />
      <TextField source="reason" />
      <DateField source="createdAt" label="Reported" showTime />
      <FunctionField
        label="Action"
        render={(record: any) => <BlockButton blocked={!record.post?.isBlocked} />}
      />
    </Datagrid>
  </List>
);

/**
 * Account deletion requests.
 *
 * A legal obligation rather than a nicety: a user asks in-app, and someone has
 * to approve or reject it. Approving anonymises the account server side.
 */
const DeleteRequestAction = ({ decision }: { decision: 'approve' | 'reject' }) => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!record || record.status !== 'PENDING') return null;

  const submit = async () => {
    setSaving(true);
    try {
      await request(`/admin/delete-requests/${record.id}/${decision}`, { method: 'POST' });
      notify(decision === 'approve' ? 'Account deleted' : 'Request rejected', {
        type: 'success',
      });
      setOpen(false);
      refresh();
    } catch (err) {
      notify((err as Error).message, { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        label={decision === 'approve' ? 'Approve' : 'Reject'}
        onClick={() => setOpen(true)}
      />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {decision === 'approve' ? 'Delete this account?' : 'Reject this request?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {decision === 'approve'
              ? 'This cannot be undone. The account and its personal data are removed.'
              : 'The user keeps their account. Tell them why separately — this does not notify them.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setOpen(false)}>Close</MuiButton>
          <MuiButton
            onClick={submit}
            disabled={saving}
            variant="contained"
            color={decision === 'approve' ? 'error' : 'primary'}
          >
            {saving ? 'Working…' : decision === 'approve' ? 'Delete account' : 'Reject'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const DeleteRequestList = () => (
  <List
    sort={{ field: 'createdAt', order: 'DESC' }}
    exporter={false}
    empty={
      <Typography sx={{ p: 3 }} color="text.secondary">
        No deletion requests.
      </Typography>
    }
  >
    <Datagrid bulkActionButtons={false}>
      <FunctionField label="User" render={(record: any) => record.user?.email ?? '—'} />
      <TextField source="status" />
      <TextField source="note" />
      <DateField source="createdAt" label="Requested" showTime />
      <FunctionField label="" render={() => <DeleteRequestAction decision="approve" />} />
      <FunctionField label="" render={() => <DeleteRequestAction decision="reject" />} />
    </Datagrid>
  </List>
);
