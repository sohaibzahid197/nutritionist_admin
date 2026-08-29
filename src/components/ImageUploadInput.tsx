import { useRef, useState } from 'react';
import { useInput, useNotify } from 'react-admin';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { request } from '../api';

/**
 * Picture field that actually uploads.
 *
 * The field itself has always been a URL on the record, and still is — the
 * difference is where that URL comes from. Previously the only way to fill it
 * was to upload the photo somewhere else, copy the address and paste it in,
 * which is not a workflow you can hand to a nutritionist. The API to do this
 * properly already existed; nothing in the panel called it.
 *
 * The address stays visible and editable so an image already hosted elsewhere
 * can still be pasted, and so a mistake can be undone by clearing the box.
 */

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic';
const MAX_BYTES = 5 * 1024 * 1024;

type UploadResponse = { url: string; thumbUrl: string | null };

export const ImageUploadInput = ({
  source,
  label = 'Image',
  helperText,
}: {
  source: string;
  label?: string;
  helperText?: string;
}) => {
  const { field } = useInput({ source });
  const notify = useNotify();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [broken, setBroken] = useState(false);

  const pick = async (file?: File | null) => {
    if (!file) return;

    // Checked here as well as on the server: a 6MB photo should fail in the
    // form, not after the upload has already been sent.
    if (file.size > MAX_BYTES) {
      notify(`That image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.`, {
        type: 'warning',
      });
      return;
    }

    const body = new FormData();
    body.append('file', file);

    setBusy(true);
    try {
      const res = await request<UploadResponse>('/uploads', { method: 'POST', body });
      field.onChange(res.url);
      setBroken(false);
      notify('Image uploaded.', { type: 'success' });
    } catch (error) {
      notify((error as Error).message || 'That image could not be uploaded.', { type: 'error' });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const value = String(field.value ?? '');

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Box
          sx={{
            width: 132,
            height: 132,
            flexShrink: 0,
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            bgcolor: 'action.hover',
          }}
        >
          {value && !broken ? (
            <img
              src={value}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setBroken(true)}
            />
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1, textAlign: 'center' }}>
              {broken ? 'Image did not load' : 'No image yet'}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              component="label"
              disabled={busy}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {busy ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </Button>
            {value ? (
              <Button
                color="inherit"
                disabled={busy}
                onClick={() => {
                  field.onChange('');
                  setBroken(false);
                }}
              >
                Remove
              </Button>
            ) : null}
          </Box>

          <TextField
            label={label}
            value={value}
            onChange={(e) => {
              field.onChange(e.target.value);
              setBroken(false);
            }}
            fullWidth
            size="small"
            helperText={helperText ?? 'JPG, PNG, WebP or HEIC, up to 5MB. Landscape photos crop best.'}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default ImageUploadInput;
