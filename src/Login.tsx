import { useState } from 'react';
import { useLogin, useNotify } from 'react-admin';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { T } from './theme';

/**
 * Replaces React-Admin's default lock-icon login with the app's own look: cream canvas,
 * Lora heading, olive CTA.
 */
export default function Login() {
  const login = useLogin();
  const notify = useNotify();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await login({ username: email, password });
    } catch (err) {
      notify((err as Error)?.message || 'Those details did not work.', { type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: T.canvas,
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={submit}
        sx={{
          width: '100%',
          maxWidth: 380,
          backgroundColor: T.card,
          border: `1px solid ${T.line}`,
          borderRadius: '14px',
          p: 4,
        }}
      >
        <Typography
          sx={{
            fontFamily: '"Lora", Georgia, serif',
            fontSize: 26,
            letterSpacing: -0.5,
            color: T.ink,
            mb: 0.5,
          }}
        >
          BiteSet
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: T.mute, mb: 3 }}>
          Sign in to the admin panel.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            fullWidth
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
            required
          />
          <Button type="submit" variant="contained" disabled={busy} size="large" fullWidth>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </Stack>

        <Typography sx={{ fontSize: 11.5, color: T.faint, mt: 3 }}>
          Admin accounts only.
        </Typography>
      </Box>
    </Box>
  );
}
