import { useCallback, useEffect, useState } from 'react';
import { Title, useNotify } from 'react-admin';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { request } from '../api';

/**
 * Send a notification to readers, and see what has already gone out.
 *
 * Two things happen on send, and the distinction matters: a row is written to
 * every recipient's notification list (which persists until they clear it) and
 * a push is delivered (which is gone the moment it is dismissed). Sending from
 * the OneSignal dashboard only does the second, which is why anything sent that
 * way never appears in the app's Notifications screen.
 */

type Audience = 'allUsers' | 'activeSubscribersOnly' | 'userIds';

type Broadcast = {
  title: string;
  body: string;
  sentAt: string;
  recipients: number;
  readCount: number;
};

const AUDIENCES: { value: Audience; label: string; note: string }[] = [
  { value: 'activeSubscribersOnly', label: 'Active subscribers', note: 'Anyone with a live plan right now.' },
  { value: 'allUsers', label: 'Everyone', note: 'Every account that is not deleted or blocked.' },
  { value: 'userIds', label: 'Specific people', note: 'Paste one user id per line.' },
];

const TITLE_MAX = 160;
const BODY_MAX = 1000;

export const NotificationSend = () => {
  const notify = useNotify();

  const [audience, setAudience] = useState<Audience>('activeSubscribersOnly');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ids, setIds] = useState('');
  const [sending, setSending] = useState(false);

  const [history, setHistory] = useState<Broadcast[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await request<{ items: Broadcast[] }>('/admin/notifications/broadcasts', {
        query: { limit: 20 },
      });
      setHistory(res.items ?? []);
    } catch {
      // A failed history load must not block sending, which is the point of the page.
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const userIds = ids
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);

  const ready =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    title.length <= TITLE_MAX &&
    body.length <= BODY_MAX &&
    (audience !== 'userIds' || userIds.length > 0);

  const send = async () => {
    if (!ready) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = { title: title.trim(), body: body.trim() };
      if (audience === 'userIds') payload.userIds = userIds;
      else payload[audience] = true;

      const res = await request<{ created: number; recipients: number }>('/admin/notifications', {
        method: 'POST',
        body: payload,
      });

      notify(`Sent to ${res.recipients} ${res.recipients === 1 ? 'person' : 'people'}.`, {
        type: 'success',
      });
      setTitle('');
      setBody('');
      setIds('');
      loadHistory();
    } catch (error) {
      notify((error as Error).message || 'Could not send that notification.', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Title title="Notifications" />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Send a notification
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            This writes the message into each reader's in-app Notifications list and sends a push.
            Sending from the OneSignal dashboard only does the push, so it never appears in the app.
          </Alert>

          <Stack spacing={2}>
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Audience
              </Typography>
              <RadioGroup value={audience} onChange={(e) => setAudience(e.target.value as Audience)}>
                {AUDIENCES.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={
                      <span>
                        {option.label}{' '}
                        <Typography component="span" variant="body2" color="text.secondary">
                          — {option.note}
                        </Typography>
                      </span>
                    }
                  />
                ))}
              </RadioGroup>
            </FormControl>

            {audience === 'userIds' ? (
              <TextField
                label="User ids"
                value={ids}
                onChange={(e) => setIds(e.target.value)}
                multiline
                minRows={3}
                fullWidth
                helperText={`${userIds.length} recipient${userIds.length === 1 ? '' : 's'}`}
              />
            ) : null}

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              error={title.length > TITLE_MAX}
              helperText={`${title.length}/${TITLE_MAX}`}
            />

            <TextField
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              error={body.length > BODY_MAX}
              helperText={`${body.length}/${BODY_MAX}`}
            />

            <Box>
              <Button variant="contained" onClick={send} disabled={!ready || sending}>
                {sending ? 'Sending…' : 'Send notification'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This cannot be undone — a sent notification reaches every recipient immediately.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Already sent
          </Typography>

          {loadingHistory ? (
            <LinearProgress />
          ) : history.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nothing has been sent yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Sent</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell align="right">Recipients</TableCell>
                  <TableCell align="right">Read</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={`${row.sentAt}-${row.title}`}>
                    <TableCell>{new Date(row.sentAt).toLocaleString('en-GB')}</TableCell>
                    <TableCell>{row.title}</TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>{row.body}</TableCell>
                    <TableCell align="right">{row.recipients}</TableCell>
                    <TableCell align="right">
                      {row.readCount}
                      {row.recipients
                        ? ` (${Math.round((row.readCount / row.recipients) * 100)}%)`
                        : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationSend;
