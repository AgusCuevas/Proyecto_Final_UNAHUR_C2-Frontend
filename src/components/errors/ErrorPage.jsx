import { Box, Button, Link, Paper, Stack, Typography, useTheme } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { useNavigate } from 'react-router-dom';
import { appTheme } from '../../theme/theme.js';

export default function ErrorPage({
  code,
  title,
  message,
  accent = appTheme.brand.primary,
}) {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...appTheme.layout.page,
        background: theme.palette.mode === 'dark'
          ? appTheme.brand.pageGradientDark
          : appTheme.brand.pageGradientLight,
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 720,
          p: { xs: 3, sm: 6 },
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 360 120"
          role="img"
          aria-label="Ilustración decorativa"
          sx={{ width: '100%', maxWidth: 360, height: 'auto', mb: { xs: 1, sm: 2 } }}
        >
          <path
            d="M24 91c30-37 51-38 78-16 23 18 42 17 66-8 25-27 52-32 76-10 19 18 40 20 92-10"
            fill="none"
            stroke={accent}
            strokeLinecap="round"
            strokeWidth="4"
            opacity=".45"
          />
          <circle cx="72" cy="46" r="9" fill={appTheme.brand.secondary} opacity=".8" />
          <circle cx="294" cy="35" r="14" fill={accent} opacity=".22" />
          <path d="M180 18l5 10 11 1-8 7 3 11-11-6-10 6 2-11-8-7 11-1z" fill={accent} opacity=".7" />
        </Box>

        <Typography
          component="p"
          sx={{
            color: accent,
            fontSize: { xs: '4.5rem', sm: '7rem' },
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-.06em',
            mb: 2,
          }}
        >
          {code}
        </Typography>

        <Typography component="h1" variant="h4" color="text.primary" sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', lineHeight: 1.7 }}>
          {message}
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="center"
          alignItems="stretch"
          sx={{ mt: 4 }}
        >
          <Button
            variant="contained"
            startIcon={<HomeRoundedIcon />}
            onClick={() => navigate('/')}
          >
            Volver al Inicio
          </Button>
          <Button
            component={Link}
            href="mailto:soporte@galacticapp.com"
            variant="text"
            color="secondary"
            startIcon={<SupportAgentRoundedIcon />}
          >
            Contactar a Soporte
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
