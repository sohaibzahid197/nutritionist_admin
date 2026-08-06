import type { ThemeOptions } from '@mui/material';

/**
 * Design tokens copied from the mobile app (`src/theme/colors.js`) so the panel and the
 * app read as one product. Names match the app's `T` object.
 */
export const T = {
  ink: '#3A3222',
  mute: '#6E6653',
  dim: '#877E68',
  line: '#E4DCC3',
  bd: '#D8CFB2',
  acc: '#4F7A34',
  accLt: '#33511F',
  accBd: '#A9C089',
  accBg: '#EAF0D9',
  card: '#FFFFFF',
  sunk: '#F4EEDC',
  well: '#EBE4CE',
  danger: '#C24B2E',
  canvas: '#FAF6E9',
  chrome: '#F6F1E0',
  page: '#F6EFDB',
  ctaBg: '#476B37',
  ctaBd: '#3F5C31',
  ctaFg: '#F7F3E2',
  faint: '#A79D85',
  tab: '#8D8570',
};

const SERIF = '"Lora", Georgia, serif';
const SANS = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const RADIUS = { md: 8, lg: 14 };

export const rootsTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: { main: T.acc, dark: T.accLt, light: T.accBd, contrastText: T.ctaFg },
    secondary: { main: T.mute },
    error: { main: T.danger },
    background: { default: T.canvas, paper: T.card },
    text: { primary: T.ink, secondary: T.mute, disabled: T.faint },
    divider: T.line,
  },

  shape: { borderRadius: RADIUS.md },

  typography: {
    fontFamily: SANS,
    // Screen titles are set in Lora in the app; mirror that for headings here.
    h1: { fontFamily: SERIF, letterSpacing: -0.5 },
    h2: { fontFamily: SERIF, letterSpacing: -0.44 },
    h3: { fontFamily: SERIF, letterSpacing: -0.34 },
    h4: { fontFamily: SERIF, letterSpacing: -0.48 },
    h5: { fontFamily: SERIF, letterSpacing: -0.22 },
    h6: { fontFamily: SERIF, fontSize: '1.15rem', letterSpacing: -0.22 },
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
    body1: { fontSize: '0.9rem' },
    body2: { fontSize: '0.85rem' },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: T.canvas },
      },
    },

    // The app has no drop shadows — surfaces are separated by a hairline instead.
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${T.line}`,
          borderRadius: RADIUS.lg,
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'default' },
      styleOverrides: {
        root: {
          backgroundColor: T.chrome,
          color: T.ink,
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          borderBottom: `1px solid ${T.line}`,
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: { color: T.ink },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS.md, paddingInline: 16 },
        // MUI v7 dropped the colour-specific override keys, so target the colour class.
        contained: {
          '&.MuiButton-colorPrimary': {
            backgroundColor: T.ctaBg,
            border: `1px solid ${T.ctaBd}`,
            color: T.ctaFg,
            '&:hover': { backgroundColor: T.accLt },
          },
        },
        text: {
          '&.MuiButton-colorPrimary': { color: T.acc },
        },
        outlined: {
          '&.MuiButton-colorPrimary': { borderColor: T.accBd, color: T.accLt },
        },
      },
    },

    MuiTable: {
      styleOverrides: {
        root: { backgroundColor: T.card },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: T.sunk,
          '& .MuiTableCell-head': {
            color: T.mute,
            fontWeight: 600,
            fontSize: '0.78rem',
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            borderBottom: `1px solid ${T.bd}`,
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${T.line}`, color: T.ink },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: T.sunk },
          '&.RaDatagrid-clickableRow:hover': { backgroundColor: T.accBg },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: T.accBg,
          border: `1px solid ${T.accBd}`,
          color: T.accLt,
        },
      },
    },

    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: T.card,
          '& fieldset': { borderColor: T.bd },
          '&:hover fieldset': { borderColor: T.accBd },
          '&.Mui-focused fieldset': { borderColor: T.acc },
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: T.chrome,
          borderRight: `1px solid ${T.line}`,
          borderRadius: 0,
        },
      },
    },

    // React-Admin's sidebar items — selected state uses the app's accent wash.
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.md,
          marginInline: 8,
          color: T.mute,
          '&.RaMenuItemLink-active': {
            backgroundColor: T.accBg,
            color: T.accLt,
            fontWeight: 600,
          },
          '&:hover': { backgroundColor: T.sunk },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: { color: 'inherit', minWidth: 36 },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { border: `1px solid ${T.bd}` },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontFamily: SERIF, fontSize: '1.25rem', letterSpacing: -0.3 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: T.ink, fontSize: '0.75rem' },
      },
    },
  },
};
