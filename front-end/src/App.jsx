import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Flag,
  Home,
  LogOut,
  Menu,
  Plus,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UploadCloud,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const logo = '/assets/logo-torrino.png';
const banner = '/assets/banner-torrino.png';
const WHATSAPP_GROUP_INVITE_URL = 'https://chat.whatsapp.com/H9xNmzvwgAbAJXd65BNrIf?mode=gi_t';
const ADMIN_API_URL = import.meta.env.VITE_ADMIN_API_URL || '';
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

const initialPlayers = [
  {
    id: 1,
    userId: 'u-kilderyyy',
    fullName: 'Dalton Kylderi Bernardo Batista',
    nickname: 'Kilderyyy35',
    position: 'Meio-campo',
    shirt: 10,
    foot: 'Direito',
    status: 'Ativo',
    role: 'Capitao',
    avatar: 'DK',
    bio: 'Meia criativo, intensidade alta e leitura rapida entre linhas.',
    stats: { goals: 18, assists: 14, recoveries: 42, matches: 24, wins: 17, losses: 5, rating: 9.1 },
  },
  {
    id: 2,
    userId: 'u-rafa',
    fullName: 'Rafael Torres',
    nickname: 'Rafa9',
    position: 'Atacante',
    shirt: 9,
    foot: 'Esquerdo',
    status: 'Ativo',
    role: 'Artilheiro',
    avatar: 'RT',
    bio: 'Finalizador de area, pressao no primeiro passe e decisao rapida.',
    stats: { goals: 24, assists: 7, recoveries: 19, matches: 21, wins: 15, losses: 4, rating: 8.8 },
  },
  {
    id: 3,
    userId: 'u-matheus',
    fullName: 'Matheus Lima',
    nickname: 'M.Lima',
    position: 'Goleiro',
    shirt: 1,
    foot: 'Direito',
    status: 'Ativo',
    role: 'Muralha',
    avatar: 'ML',
    bio: 'Goleiro seguro, boa saida curta e reflexo em finalizacoes proximas.',
    stats: { goals: 0, assists: 2, recoveries: 8, matches: 22, wins: 16, losses: 4, rating: 8.6 },
  },
  {
    id: 4,
    userId: 'u-joao',
    fullName: 'Joao Henrique',
    nickname: 'JH5',
    position: 'Volante',
    shirt: 5,
    foot: 'Direito',
    status: 'Reserva',
    role: 'Motor',
    avatar: 'JH',
    bio: 'Volante de combate, protege a defesa e acelera transicoes.',
    stats: { goals: 5, assists: 9, recoveries: 55, matches: 20, wins: 13, losses: 5, rating: 8.4 },
  },
];

const initialUsers = [
  {
    id: 'u-kilderyyy',
    name: 'Dalton Kylderi Bernardo Batista',
    nickname: 'Kilderyyy35',
    email: 'kilderyyy@torinnofc.gg',
    password: 'torinnofc123',
    role: 'admin',
    staffRole: 'Fundador',
    position: 'Meio-campo',
    shirt: '10',
    playerId: 1,
  },
  {
    id: 'u-rafa',
    name: 'Rafael Torres',
    nickname: 'Rafa9',
    email: 'rafa@torinnofc.gg',
    password: 'torinnofc123',
    role: 'admin',
    staffRole: 'Diretor',
    position: 'Atacante',
    shirt: '9',
    playerId: 2,
  },
  {
    id: 'u-matheus',
    name: 'Matheus Lima',
    nickname: 'M.Lima',
    email: 'matheus@torinnofc.gg',
    password: 'torinnofc123',
    role: 'player',
    staffRole: 'Goleiro titular',
    position: 'Goleiro',
    shirt: '1',
    playerId: 3,
  },
  {
    id: 'u-joao',
    name: 'Joao Henrique',
    nickname: 'JH5',
    email: 'joao@torinnofc.gg',
    password: 'torinnofc123',
    role: 'player',
    staffRole: 'Capitao de lobby',
    position: 'Volante',
    shirt: '5',
    playerId: 4,
  },
];

const initialMatches = [
  {
    id: 1,
    home: 'TorinnoFC',
    away: 'Vikings FC',
    date: 'Hoje',
    time: '20:30',
    place: 'Arena Society Norte',
    championship: 'Liga Premium',
    status: 'Agendada',
    score: '-',
    dateKey: toDateKey(new Date()),
  },
  {
    id: 2,
    home: 'TorinnoFC',
    away: 'Apollo Digital',
    date: 'Amanha',
    time: '21:00',
    place: 'Campo Central',
    championship: 'Copa Digital',
    status: 'Em andamento',
    score: '1 x 1',
    dateKey: toDateKey(addDays(new Date(), 1)),
  },
  {
    id: 3,
    home: 'TorinnoFC',
    away: 'Uniao FC',
    date: 'Domingo',
    time: '18:00',
    place: 'Arena Horizonte',
    championship: 'Amistoso',
    status: 'Agendada',
    score: '-',
    dateKey: toDateKey(addDays(new Date(), 5)),
  },
];

const initialTryouts = [
  {
    id: 1,
    fullName: 'Kilderyyy35',
    age: 87,
    position: 'Atacante',
    contact: 'Discord: torinnofc#2026',
    date: toDateKey(addDays(new Date(), 2)),
    time: '18:30',
    place: 'EA FC 26 | Clubs',
    notes: 'Teste em lobby privado. Entrar 10 min antes e usar headset.',
    status: 'Agendada',
  },
];

const navItems = [
  { id: 'dashboard', label: 'Painel', icon: Home },
  { id: 'profile', label: 'Meu Perfil', icon: User },
  { id: 'performance', label: 'Meu Desempenho', icon: Activity },
  { id: 'players', label: 'Jogadores', icon: Users },
  { id: 'tryouts', label: 'Peneiras', icon: UserPlus },
  { id: 'matches', label: 'Partidas', icon: Flag },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'team', label: 'Time', icon: Shield },
  { id: 'championships', label: 'Campeonatos', icon: Crown },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
];

const positions = [
  'Goleiro',
  'Zagueiro',
  'Lateral direito',
  'Lateral esquerdo',
  'Volante',
  'Meio-campo',
  'Meia-atacante',
  'Ponta direita',
  'Ponta esquerda',
  'Atacante',
];

const gamePositions = [
  'Goleiro',
  'Zagueiro',
  'Lateral',
  'Volante',
  'Meia',
  'Ponta',
  'Atacante',
  'Centroavante',
];

const statusFlow = ['Agendada', 'Em andamento', 'Encerrada'];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function buildOpponentLogoDataUrl(name = 'Adversario') {
  const initials = getInitials(name || 'AD');
  const safeInitials = initials.replace(/[^A-Z0-9]/g, '').slice(0, 2) || 'AD';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="24" fill="#0b0f16"/>
      <circle cx="48" cy="48" r="34" fill="#4a0712" stroke="#d4a24c" stroke-width="3"/>
      <text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#f6c768">${safeInitials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeMatchEvent(match) {
  return {
    ...match,
    home: match.home || 'TorinnoFC',
    homeLogo: match.homeLogo || logo,
    away: match.away || 'Adversario',
    opponentLogo: match.opponentLogo || buildOpponentLogoDataUrl(match.away),
    date: match.date || formatDateLabel(match.dateKey),
    time: match.time || 'A definir',
    place: match.place || 'A definir',
    championship: match.championship || 'Agenda',
    status: match.status || 'Agendada',
    score: match.score || '-',
    dateKey: match.dateKey,
    type: 'Partida',
  };
}

function buildCalendarEvents(matches, tryouts = []) {
  return [
    ...matches.map((match) => {
      const normalized = normalizeMatchEvent(match);
      return {
        ...normalized,
        calendarId: `match-${normalized.id}`,
        source: 'match',
        title: `${normalized.home} x ${normalized.away}`,
        subtitle: `${normalized.time} | ${normalized.place} | ${normalized.status}`,
        logo: normalized.opponentLogo,
      };
    }),
    ...tryouts.map((tryout) => ({
      ...tryout,
      calendarId: `tryout-${tryout.id}`,
      source: 'tryout',
      type: 'Peneira',
      dateKey: tryout.date,
      time: tryout.time || 'A definir',
      title: `Peneira: ${tryout.fullName || 'Novo jogador'}`,
      subtitle: `${tryout.time || 'A definir'} | ${tryout.place || 'EA FC 26 | Clubs'} | ${tryout.status || 'Agendada'}`,
      logo,
      status: tryout.status || 'Agendada',
    })),
  ];
}

async function sendOfficialNotification(kind, payload) {
  if (!ADMIN_API_URL || !ADMIN_API_KEY) {
    return { ok: false, reason: 'backend-not-configured' };
  }

  const endpoint = kind === 'match' ? '/api/admin/matches' : '/api/admin/tryouts';
  const response = await fetch(`${ADMIN_API_URL.replace(/\/$/, '')}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-api-key': ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail || `Falha HTTP ${response.status}`);
  }

  return response.json();
}

async function notifyMatchCreated(match, notify) {
  const message = buildMatchWhatsAppMessage(match);

  try {
    const result = await sendOfficialNotification('match', {
      home_team: match.home || 'TorinnoFC',
      away_team: match.away,
      match_date: match.dateKey,
      match_time: match.time,
      location: match.place,
      status: match.status,
      observations: match.championship,
    });

    if (result?.notification?.ok) {
      notify('Partida criada, calendario atualizado e WhatsApp oficial enviado.');
      return;
    }
  } catch {
    // Fallback abaixo abre o grupo e copia a mensagem.
  }

  openWhatsAppGroupWithMessage(message, notify);
}

async function notifyTryoutCreated(tryout, notify) {
  const message = buildTryoutWhatsAppMessage(tryout);

  try {
    const result = await sendOfficialNotification('tryout', {
      title: tryout.fullName || 'Peneira TorrinoFC',
      tryout_date: tryout.date,
      tryout_time: tryout.time,
      location: tryout.place,
      category: tryout.position,
      requirements: tryout.age ? `OVR ${tryout.age}` : '',
      observations: [tryout.contact, tryout.notes].filter(Boolean).join(' | '),
      status: tryout.status,
    });

    if (result?.notification?.ok) {
      notify('Peneira criada, calendario atualizado e WhatsApp oficial enviado.');
      return;
    }
  } catch {
    // Fallback abaixo abre o grupo e copia a mensagem.
  }

  openWhatsAppGroupWithMessage(message, notify);
}

function openWhatsAppGroupWithMessage(message, notify) {
  const tab = window.open(WHATSAPP_GROUP_INVITE_URL, '_blank', 'noopener,noreferrer');

  copyTextToClipboard(message)
    .then(() => notify('Mensagem copiada. Cole no grupo do WhatsApp aberto.'))
    .catch(() => notify('Grupo aberto. Copie a mensagem do agendamento manualmente.'));

  if (!tab) {
    window.location.href = WHATSAPP_GROUP_INVITE_URL;
  }
}

function buildMatchWhatsAppMessage(match) {
  return [
    'Nova partida agendada - Torrino FC',
    '',
    `Data: ${match.date || formatDateLabel(match.dateKey)}`,
    `Horario: ${match.time || 'A definir'}`,
    `Local: ${match.place || 'A definir'}`,
    'Tipo: Partida',
    '',
    'Times:',
    `${match.home || 'TorinnoFC'} x ${match.away || 'Adversario'}`,
    '',
    'Informacoes extras:',
    match.championship || 'Sem observacoes.',
    '',
    'Acesse o site para mais detalhes.',
  ].join('\n');
}

function buildTryoutWhatsAppMessage(tryout) {
  return [
    'Nova peneira agendada - Torrino FC',
    '',
    `Data: ${formatDateLabel(tryout.date)}`,
    `Horario: ${tryout.time || 'A definir'}`,
    `Local: ${tryout.place || 'A definir'}`,
    `Categoria: ${tryout.position || 'Geral'}`,
    '',
    'Requisitos:',
    tryout.age ? `OVR ${tryout.age}` : 'Nao informado',
    '',
    'Observacoes:',
    tryout.notes || 'Sem observacoes.',
    '',
    'Interessados devem acessar o site e realizar o cadastro.',
  ].join('\n');
}

function makeCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: toDateKey(date),
      date,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      today: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

function readStorageList(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function readSavedUsers() {
  const saved = readStorageList('torinnofc-users', initialUsers);
  const merged = [...initialUsers];

  saved.forEach((user) => {
    if (!user?.email) return;
    const index = merged.findIndex((item) => item.email.toLowerCase() === user.email.toLowerCase());
    if (index >= 0) {
      merged[index] = normalizeUser({ ...merged[index], ...user });
    } else {
      merged.push(normalizeUser(user));
    }
  });

  return merged;
}

function readSavedPlayers() {
  const saved = readStorageList('torinnofc-players', initialPlayers);
  const merged = [...initialPlayers];

  saved.forEach((player) => {
    if (!player?.id) return;
    const index = merged.findIndex((item) => item.id === player.id);
    if (index >= 0) {
      merged[index] = normalizePlayer({ ...merged[index], ...player });
    } else {
      merged.push(normalizePlayer(player));
    }
  });

  return merged;
}

function readSavedMatches() {
  return readStorageList('torinnofc-matches', initialMatches).map(normalizeMatchEvent);
}

function readSavedSession(users = readSavedUsers()) {
  try {
    const saved = localStorage.getItem('torinnofc-session');
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem('torinnofc-session');
      return null;
    }

    const current = users.find((user) => user.id === parsed.id || user.email?.toLowerCase() === parsed.email?.toLowerCase());
    return current ? publicUser(current) : publicUser(parsed);
  } catch {
    localStorage.removeItem('torinnofc-session');
    return null;
  }
}

function readSavedTryouts() {
  try {
    const saved = localStorage.getItem('torinnofc-tryouts');
    if (!saved) {
      return initialTryouts;
    }

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeTryout) : initialTryouts;
  } catch {
    localStorage.removeItem('torinnofc-tryouts');
    return initialTryouts;
  }
}

function normalizeTryout(tryout) {
  return {
    ...tryout,
    place: tryout.place === 'Arena Society Norte' ? 'EA FC 26 | Clubs' : tryout.place,
    notes: tryout.notes?.toLowerCase().includes('chuteira')
      ? 'Teste em lobby privado. Entrar 10 min antes e usar headset.'
      : tryout.notes,
  };
}

function normalizeUser(user) {
  return {
    id: user.id || `u-${Date.now()}`,
    name: user.name || user.nickname || 'Jogador TorinnoFC',
    nickname: user.nickname || user.name || 'Jogador',
    email: user.email || '',
    password: user.password || 'torinnofc123',
    role: user.role === 'admin' ? 'admin' : 'player',
    staffRole: user.staffRole || (user.role === 'admin' ? 'Admin' : 'Jogador'),
    position: user.position || 'Meio-campo',
    shirt: String(user.shirt || '10'),
    playerId: user.playerId,
    photo: user.photo || '',
  };
}

function normalizePlayer(player) {
  return {
    ...player,
    id: player.id || Date.now(),
    userId: player.userId,
    fullName: player.fullName || player.nickname || 'Jogador TorinnoFC',
    nickname: player.nickname || player.fullName || 'Jogador',
    position: player.position || 'Meio-campo',
    shirt: Number(player.shirt) || 0,
    avatar: player.avatar || getInitials(player.nickname || player.fullName),
    bio: player.bio || 'Jogador cadastrado na plataforma TorinnoFC.',
    stats: {
      goals: Number(player.stats?.goals) || 0,
      assists: Number(player.stats?.assists) || 0,
      recoveries: Number(player.stats?.recoveries) || 0,
      matches: Number(player.stats?.matches) || 0,
      wins: Number(player.stats?.wins) || 0,
      losses: Number(player.stats?.losses) || 0,
      rating: Number(player.stats?.rating) || 0,
      shots: Number(player.stats?.shots) || 0,
      passes: Number(player.stats?.passes) || 0,
      yellow: Number(player.stats?.yellow) || 0,
      red: Number(player.stats?.red) || 0,
      notes: player.stats?.notes || '',
    },
  };
}

function publicUser(user) {
  const normalized = normalizeUser(user);
  const safeUser = { ...normalized };
  delete safeUser.password;
  return safeUser;
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Jogador';
}

function createPlayerFromUser(user) {
  return normalizePlayer({
    id: Date.now(),
    userId: user.id,
    fullName: user.name,
    nickname: user.nickname,
    position: user.position,
    shirt: Number(user.shirt) || 0,
    foot: 'Direito',
    status: 'Ativo',
    role: user.staffRole || 'Jogador',
    avatar: getInitials(user.nickname || user.name),
    photo: user.photo || '',
    bio: 'Novo jogador cadastrado na plataforma TorinnoFC.',
    stats: { goals: 0, assists: 0, recoveries: 0, matches: 0, wins: 0, losses: 0, rating: 0 },
  });
}

function findPlayerForUser(user, players) {
  return players.find((player) => player.userId === user.id || player.id === user.playerId) || players[0];
}

function App() {
  const [users, setUsers] = useState(readSavedUsers);
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(() => readSavedSession(readSavedUsers()));
  const [authMode, setAuthMode] = useState('login');
  const [view, setView] = useState(session ? 'dashboard' : 'landing');
  const [players, setPlayers] = useState(readSavedPlayers);
  const [matches, setMatches] = useState(readSavedMatches);
  const [tryouts, setTryouts] = useState(readSavedTryouts);
  const [selectedPlayerId, setSelectedPlayerId] = useState(1);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('torinnofc-settings') || '{}');
      const darkTheme = savedSettings?.appearance?.darkTheme !== false;
      document.documentElement.classList.toggle('light-theme', !darkTheme);
    } catch {
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('torinnofc-users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('torinnofc-players', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('torinnofc-matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    if (!session) return;
    const current = users.find((item) => item.id === session.id);
    if (!current) return;
    const nextSession = publicUser(current);
    if (JSON.stringify(nextSession) !== JSON.stringify(session)) {
      setSession(nextSession);
    }
  }, [users, session]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('torinnofc-session', JSON.stringify(session));
    } else {
      localStorage.removeItem('torinnofc-session');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('torinnofc-tryouts', JSON.stringify(tryouts));
  }, [tryouts]);

  if (booting) {
    return <Preloader />;
  }

  const handleAuth = (form, isRegister) => {
    const email = form.email.trim().toLowerCase();
    const existing = users.find((user) => user.email.toLowerCase() === email);

    if (isRegister) {
      if (existing) {
        return { error: 'Este e-mail ja esta cadastrado. Faca login para continuar.' };
      }

      const user = normalizeUser({
        id: `u-${Date.now()}`,
        name: form.name.trim(),
        nickname: form.nickname.trim(),
        email,
        password: form.password,
        role: email.includes('admin') ? 'admin' : 'player',
        staffRole: email.includes('admin') ? 'Admin' : 'Jogador',
        position: form.position,
        shirt: form.shirt,
      });
      const player = createPlayerFromUser(user);
      const userWithPlayer = { ...user, playerId: player.id };

      setUsers((items) => [...items, userWithPlayer]);
      setPlayers((items) => [player, ...items]);
      setSession(publicUser(userWithPlayer));
      setView('dashboard');
      return { ok: true };
    }

    if (!existing || existing.password !== form.password) {
      return { error: 'E-mail ou senha incorretos.' };
    }

    setSession(publicUser(existing));
    setView('dashboard');
    return { ok: true };
  };

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  const logout = () => {
    setSession(null);
    setView('landing');
  };

  if (!session) {
    if (view === 'auth') {
      return <AuthScreen mode={authMode} setMode={setAuthMode} onAuth={handleAuth} onBack={() => setView('landing')} />;
    }

    return (
      <Landing
        onLogin={() => {
          setAuthMode('login');
          setView('auth');
        }}
        onRegister={() => {
          setAuthMode('register');
          setView('auth');
        }}
      />
    );
  }

  return (
    <DashboardShell user={session} view={view} setView={setView} onLogout={logout} notify={notify}>
      <PageRouter
        view={view}
        setView={setView}
        user={session}
        setUser={setSession}
        users={users}
        setUsers={setUsers}
        players={players}
        setPlayers={setPlayers}
        matches={matches}
        setMatches={setMatches}
        tryouts={tryouts}
        setTryouts={setTryouts}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
        notify={notify}
      />
      {toast && <Toast message={toast} />}
    </DashboardShell>
  );
}

function Preloader() {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLeaving(true), 1350);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className={`preloader ${isLeaving ? 'leaving' : ''}`}>
      <div className="preloader-glow" aria-hidden="true" />
      <section className="preloader-content">
        <div className="crest-stage">
          <div className="crest-glow" aria-hidden="true" />
          <img src={logo} alt="TorinnoFC" />
        </div>

        <h1>
          Carregando
          <span className="loading-dots">...</span>
        </h1>

        <div className="loading-bar" aria-hidden="true">
          <div className="bar-shine" />
          <div className="bar-fill" />
        </div>

        <p>TorinnoFC</p>
      </section>
    </main>
  );
}

function Landing({ onLogin, onRegister }) {
  return (
    <main className="landing">
      <section className="hero">
        <img className="hero-bg" src={banner} alt="" />
        <div className="hero-content">
          <img className="hero-crest" src={logo} alt="Escudo TorinnoFC" />
          <div className="eyebrow">
            <Sparkles size={16} />
            Est. 2026 | Plataforma oficial
          </div>
          <h1>
            <span className="hero-name">Torinno</span>
            <span className="hero-fc">FC</span>
          </h1>
          <p>Joga bonito, compete serio, representa sempre.</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={onLogin}>
              Entrar na Plataforma
              <ChevronRight size={18} />
            </button>
            <button className="button secondary" type="button" onClick={onRegister}>
              Cadastrar Jogador
            </button>
          </div>
        </div>
        <div className="hero-stars" aria-hidden="true">
          <Star size={20} />
          <Star size={15} />
          <Star size={12} />
          <Star size={9} />
          <Star size={7} />
        </div>
      </section>
    </main>
  );
}

function AuthScreen({ mode, setMode, onAuth, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    position: 'Meio-campo',
    shirt: '10',
    website: '',
  });
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    if (form.website) {
      setError('Verificacao bloqueada. Tente novamente.');
      return;
    }
    if (!form.email.includes('@')) {
      setError('Digite um e-mail valido.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (isRegister && (!form.name.trim() || !form.nickname.trim())) {
      setError('Preencha nome completo e apelido.');
      return;
    }

    const result = onAuth(form, isRegister);
    if (result?.error) {
      setError(result.error);
      return;
    }

    setError('');
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src={banner} alt="" />
        <button className="brand-mark floating" type="button" onClick={onBack}>
          <img src={logo} alt="" />
          <span>TorinnoFC</span>
        </button>
        <div>
          <p>Area oficial</p>
          <h1>{isRegister ? 'CADASTRO DE JOGADOR' : 'ENTRAR NA PLATAFORMA'}</h1>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            Cadastro
          </button>
        </div>

        <form onSubmit={submit}>
          <input
            className="bot-trap"
            tabIndex="-1"
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
          {isRegister && (
            <>
              <Field label="Nome completo" value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <Field label="Apelido no time" value={form.nickname} onChange={(nickname) => setForm({ ...form, nickname })} />
            </>
          )}
          <Field label="E-mail" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          <label className="field">
            <span>Senha</span>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="minimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar senha">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {isRegister && (
            <div className="form-grid">
              <label className="field">
                <span>Posicao</span>
                <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                  {positions.map((position) => (
                    <option key={position}>{position}</option>
                  ))}
                </select>
              </label>
              <Field label="Camisa" type="number" value={form.shirt} onChange={(shirt) => setForm({ ...form, shirt })} />
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <button className="button primary full" type="submit">
            {isRegister ? 'Criar conta' : 'Entrar'}
            <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </main>
  );
}

function DashboardShell({ children, user, view, setView, onLogout, notify }) {
  const [open, setOpen] = useState(false);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <img src={logo} alt="TorinnoFC" />
          <div>
            <strong>TorinnoFC</strong>
            <span>Digital</span>
          </div>
          <button className="icon-button mobile-close" type="button" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{getInitials(user.nickname || user.name)}</div>
          <div>
            <strong>{user.nickname || user.name}</strong>
            <span>{user.staffRole || roleLabel(user.role)}</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.filter((item) => item.id !== 'admin' || user.role === 'admin').map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? 'active' : ''}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="logout-button" type="button" onClick={onLogout}>
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => setOpen(true)}>
            <Menu size={21} />
          </button>
          <div>
            <span>TorinnoFC</span>
            <strong>{pageTitle(view)}</strong>
          </div>
          <button className="notification" type="button" onClick={() => notify('Voce tem 3 avisos de partidas e ranking.')}>
            <Bell size={18} />
            <small>3</small>
          </button>
        </header>
        {children}
      </section>
    </main>
  );
}

function PageRouter(props) {
  const { view } = props;
  const pages = {
    dashboard: <Dashboard {...props} />,
    profile: <Profile {...props} />,
    performance: <Performance {...props} />,
    players: <Players {...props} />,
    'player-detail': <PlayerDetail {...props} />,
    tryouts: <Tryouts {...props} />,
    matches: <Matches {...props} />,
    calendar: <Calendar {...props} />,
    ranking: <Ranking {...props} />,
    team: <Team {...props} />,
    championships: <Championships notify={props.notify} />,
    admin: <AdminPanel {...props} />,
    settings: <SettingsPage {...props} />,
  };

  return pages[view] || <Dashboard {...props} />;
}

function Dashboard({ user, players, matches, setView }) {
  const endedMatches = matches.filter((match) => match.status === 'Encerrada');
  const activeChampionships = ['Liga Premium', 'Copa Digital'];
  const teamStats = getTeamStats(players, matches);

  return (
    <div className="page-grid">
      <section className="main-column">
        <div className="dashboard-welcome panel">
          <div className="icon-tile gold">
            <Shield size={18} />
          </div>
          <div>
            <span>Painel oficial</span>
            <h2>Bem-vindo, {user.nickname || user.name}</h2>
            <p>Resumo limpo do elenco, calendario e desempenho competitivo do TorrinoFC.</p>
          </div>
          <button className="button secondary" type="button" onClick={() => setView('profile')}>
            Meu perfil
          </button>
        </div>

        <div className="dashboard-metrics">
          <StatCard icon={Trophy} value={`${teamStats.winRate}%`} label="Aproveitamento" />
          <StatCard icon={BarChart3} value={teamStats.totalGoals} label="Gols do elenco" />
          <StatCard icon={Users} value={players.length} label="Jogadores" />
          <StatCard icon={Star} value={teamStats.avgRating} label="Nota media" />
        </div>

        <TeamInsights stats={teamStats} players={players} setView={setView} />

        <div className="dashboard-panels">
          <article className="panel dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <span>Competicoes</span>
                <h3>Campeonatos recentes</h3>
              </div>
              <button className="action-link" type="button" onClick={() => setView('championships')}>
                Ver todos
              </button>
            </div>
            <div className="dashboard-list">
              {activeChampionships.map((name, index) => (
                <div className="dashboard-list-row" key={name}>
                  <div className={`icon-tile ${index === 0 ? 'green' : 'blue'}`}>
                    <Trophy size={16} />
                  </div>
                  <div>
                    <strong>{name}</strong>
                    <span>{index === 0 ? 'Fase de grupos' : 'Preparacao'}</span>
                  </div>
                  <small className={`status ${index === 0 ? 'live' : ''}`}>{index === 0 ? 'Ativo' : 'Em breve'}</small>
                </div>
              ))}
            </div>
          </article>

          <article className="panel dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <span>Resultados</span>
                <h3>Jogos encerrados</h3>
              </div>
              <button className="action-link" type="button" onClick={() => setView('calendar')}>
                Calendario
              </button>
            </div>
            <div className="dashboard-list">
              {endedMatches.slice(0, 4).map((match) => (
                <div className="dashboard-list-row" key={match.id}>
                  <div className="icon-tile gold">
                    <Flag size={16} />
                  </div>
                  <div>
                    <strong>{match.home} x {match.away}</strong>
                    <span>{match.date}, {match.time} | {match.score}</span>
                  </div>
                </div>
              ))}
              {endedMatches.length === 0 && (
                <EmptyState icon={Flag} title="Nenhuma partida encerrada ainda" description="Quando um jogo for finalizado, ele aparece aqui." action="Abrir calendario" onAction={() => setView('calendar')} />
              )}
            </div>
          </article>
        </div>
      </section>

      <aside className="side-column">
        <div className="spotlight-card dashboard-side-card">
          <img src={logo} alt="" />
          <span>Identidade 2026</span>
          <h3>TorinnoFC</h3>
          <p>Clube organizado, dados vivos e desempenho acompanhando cada rodada.</p>
          <button className="button secondary full" type="button" onClick={() => setView('tryouts')}>
            Marcar teste
          </button>
        </div>
        <TopRanking players={players} />
      </aside>
    </div>
  );
}

function getTeamStats(players, matches) {
  const totals = players.reduce(
    (sum, player) => ({
      goals: sum.goals + (Number(player.stats?.goals) || 0),
      assists: sum.assists + (Number(player.stats?.assists) || 0),
      recoveries: sum.recoveries + (Number(player.stats?.recoveries) || 0),
      rating: sum.rating + (Number(player.stats?.rating) || 0),
      matches: sum.matches + (Number(player.stats?.matches) || 0),
    }),
    { goals: 0, assists: 0, recoveries: 0, rating: 0, matches: 0 },
  );

  const finished = matches.filter((match) => match.status === 'Encerrada');
  const wins = finished.filter((match) => {
    const [homeScore, awayScore] = String(match.score || '').split('x').map((value) => Number(value.trim()));
    return Number.isFinite(homeScore) && Number.isFinite(awayScore) && homeScore > awayScore;
  }).length;
  const draws = finished.filter((match) => {
    const [homeScore, awayScore] = String(match.score || '').split('x').map((value) => Number(value.trim()));
    return Number.isFinite(homeScore) && Number.isFinite(awayScore) && homeScore === awayScore;
  }).length;
  const losses = Math.max(finished.length - wins - draws, 0);
  const avgRating = players.length ? (totals.rating / players.length).toFixed(1) : '0.0';
  const winRate = finished.length ? Math.round((wins / finished.length) * 100) : 0;
  const positionCounts = players.reduce((items, player) => {
    const key = player.position || 'Sem posicao';
    items[key] = (items[key] || 0) + 1;
    return items;
  }, {});

  return {
    totalGoals: totals.goals,
    assists: totals.assists,
    recoveries: totals.recoveries,
    avgRating,
    playerMatches: totals.matches,
    finishedMatches: finished.length,
    wins,
    draws,
    losses,
    winRate,
    positionCounts,
  };
}

function TeamInsights({ stats, players, setView }) {
  const positionEntries = Object.entries(stats.positionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const positionLabels = positionEntries.map(([position]) => position);
  const positionValues = positionEntries.map(([, amount]) => amount);

  return (
    <div className="dashboard-analytics">
      <article className="panel analytics-card">
        <div className="dashboard-panel-head">
          <div>
            <span>Forma</span>
            <h3>Resumo competitivo</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('matches')}>
            Partidas
          </button>
        </div>
        <ApexChart
          className="chart-box small"
          options={{
            chart: { type: 'radialBar', sparkline: { enabled: true } },
            series: [stats.winRate],
            labels: ['Vitorias'],
            colors: ['#d4a24c'],
            plotOptions: {
              radialBar: {
                hollow: {
                  size: '66%',
                  background: 'rgba(8, 11, 18, 0.92)',
                },
                track: {
                  background: 'rgba(148, 163, 184, 0.14)',
                  strokeWidth: '100%',
                },
                dataLabels: {
                  name: {
                    show: true,
                    offsetY: 18,
                    color: '#99a4b8',
                    fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
                    fontSize: '11px',
                    fontWeight: 800,
                  },
                  value: {
                    show: true,
                    offsetY: -8,
                    color: '#fff7d6',
                    fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    formatter: (value) => `${Math.round(value)}%`,
                  },
                },
              },
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                type: 'horizontal',
                gradientToColors: ['#f59e0b'],
                stops: [0, 100],
              },
            },
            stroke: { lineCap: 'round' },
            tooltip: { enabled: true, theme: 'dark', y: { formatter: (value) => `${value}%` } },
          }}
        />
        <div className="chart-legend">
          <span><i className="win" /> {stats.wins}V</span>
          <span><i className="draw" /> {stats.draws}E</span>
          <span><i className="loss" /> {stats.losses}D</span>
        </div>
      </article>

      <article className="panel analytics-card wide">
        <div className="dashboard-panel-head">
          <div>
            <span>Producao</span>
            <h3>Forca do elenco</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('performance')}>
            Desempenho
          </button>
        </div>
        <ApexChart
          className="chart-box"
          options={makeApexBarOptions({
            categories: ['Gols', 'Assist.', 'Roubadas'],
            series: [{ name: 'Total', data: [stats.totalGoals, stats.assists, stats.recoveries] }],
            colors: ['#d4a24c'],
          })}
        />
      </article>

      <article className="panel analytics-card wide">
        <div className="dashboard-panel-head">
          <div>
            <span>Elenco</span>
            <h3>Posicoes</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('players')}>
            Jogadores
          </button>
        </div>
        <div className="position-chart">
          {!!positionEntries.length && (
            <ApexChart
              className="chart-box"
              options={makeApexBarOptions({
                categories: positionLabels,
                series: [{ name: 'Jogadores', data: positionValues }],
                horizontal: true,
                colors: ['#f6c768'],
              })}
            />
          )}
          {!players.length && <EmptyState icon={Users} title="Sem jogadores" />}
        </div>
      </article>
    </div>
  );
}

function makeApexBarOptions({ categories, series, horizontal = false, colors = ['#d4a24c'] }) {
  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 650 },
      foreColor: '#99a4b8',
      fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
    },
    series,
    colors,
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 8,
        columnWidth: '48%',
        barHeight: '58%',
        distributed: !horizontal,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: horizontal ? 'horizontal' : 'vertical',
        shadeIntensity: 0.2,
        gradientToColors: horizontal ? ['#d4a24c'] : ['#f59e0b', '#d4a24c', '#60a5fa'],
        opacityFrom: 0.98,
        opacityTo: 0.72,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.08)',
      strokeDashArray: 4,
      padding: horizontal
        ? { top: -6, right: 4, bottom: -8, left: 34 }
        : { top: -6, right: 8, bottom: -8, left: 2 },
    },
    xaxis: {
      categories,
      tickAmount: 3,
      labels: {
        trim: false,
        style: {
          colors: '#aeb8ca',
          fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        minWidth: horizontal ? 106 : 0,
        maxWidth: horizontal ? 128 : 44,
        trim: false,
        formatter: (value) => value,
        style: {
          colors: '#aeb8ca',
          fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value) => `${value}` },
    },
    legend: { show: false },
  };
}

function ApexChart({ options, className = '' }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    let chart;
    let active = true;

    import('apexcharts').then(({ default: ApexCharts }) => {
      if (!active || !chartRef.current) return;

      const height = chartRef.current.clientHeight || 150;
      chart = new ApexCharts(chartRef.current, {
        ...options,
        chart: {
          background: 'transparent',
          ...options.chart,
          height,
          width: '100%',
        },
      });
      chart.render();
    });

    return () => {
      active = false;
      chart?.destroy();
    };
  }, [options]);

  return (
    <div className={className}>
      <div ref={chartRef} className="apex-chart" aria-label="Grafico do painel" role="img" />
    </div>
  );
}

function Profile({ user, setUser, users, setUsers, players, setPlayers, setView, notify }) {
  const base = findPlayerForUser(user, players);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || base.fullName,
    nickname: user.nickname || base.nickname,
    position: user.position || base.position,
    shirt: user.shirt || base.shirt,
    bio: base.bio,
    photo: user.photo || base.photo || '',
  });
  const profilePhoto = form.photo || user.photo || base.photo || '';
  const username = `@${(form.name || form.nickname).replace(/\s+/g, '_')}`;
  const statusLabel = base.status === 'Ativo' ? 'Contratado' : base.status || 'Contratado';
  const [teamInfo, setTeamInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('torinnofc-team')) || { name: 'Vikingsss FC', code: '83987726302' };
    } catch {
      return { name: 'Vikingsss FC', code: '83987726302' };
    }
  });
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState(teamInfo || { name: '', code: '' });

  useEffect(() => {
    if (teamInfo) {
      localStorage.setItem('torinnofc-team', JSON.stringify(teamInfo));
    } else {
      localStorage.removeItem('torinnofc-team');
    }
  }, [teamInfo]);

  const handleProfilePhotoChange = async (file) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      notify('Use uma foto PNG, JPG, JPEG ou WEBP.');
      return;
    }

    if (file.size > maxSize) {
      notify('A foto deve ter no maximo 5MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm({ ...form, photo: dataUrl });
      notify('Foto carregada. Salve o perfil para manter a alteracao.');
    } catch {
      notify('Nao foi possivel carregar a foto.');
    }
  };

  return (
    <section className="profile-layout">
      <div className="panel profile-summary-card">
        <div className={`avatar profile-avatar ${profilePhoto ? 'has-photo' : ''}`}>
          {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
        </div>
        <div className="profile-summary-copy">
          <h2>{form.nickname}</h2>
          <span>{form.position} | {user.staffRole || roleLabel(user.role)}</span>
          {user.email && <small>{user.email}</small>}
        </div>
        <button className="button secondary" type="button" onClick={() => setEditing(!editing)}>
          <Edit3 size={16} />
          Editar perfil
        </button>
      </div>

      {editing && (
        <div className="panel profile-edit-panel">
          <div className="profile-photo-editor">
            <label className="profile-photo-picker" aria-label="Adicionar foto de perfil">
              <span className={`avatar profile-avatar ${profilePhoto ? 'has-photo' : ''}`}>
                {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
              </span>
              <span className="profile-photo-plus">
                <Plus size={15} />
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                capture="environment"
                onChange={(event) => handleProfilePhotoChange(event.target.files?.[0])}
              />
            </label>
            <div className="profile-photo-copy">
              <strong>Foto de perfil</strong>
            </div>
            {profilePhoto && (
              <button className="button minimal danger" type="button" onClick={() => setForm({ ...form, photo: '' })}>
                Remover foto
              </button>
            )}
          </div>
          <div className="form-grid">
            <Field label="Nome completo" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Apelido" value={form.nickname} onChange={(nickname) => setForm({ ...form, nickname })} />
            <label className="field">
              <span>Posicao</span>
              <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <Field label="Camisa" type="number" value={form.shirt} onChange={(shirt) => setForm({ ...form, shirt })} />
          </div>
          <label className="field">
            <span>Bio curta</span>
            <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </label>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              if (!form.name.trim() || !form.nickname.trim()) {
                notify('Preencha nome completo e apelido.');
                return;
              }

              if (!isValidShirtNumber(form.shirt)) {
                notify('Digite uma camisa valida entre 1 e 999.');
                return;
              }

              const nextUser = {
                ...user,
                name: form.name.trim(),
                nickname: form.nickname.trim(),
                position: form.position,
                shirt: form.shirt,
                photo: form.photo,
              };
              setUser(nextUser);
              setUsers(users.map((item) => (item.id === user.id ? { ...item, ...nextUser } : item)));
              setPlayers(
                players.map((player) =>
                  player.id === base.id
                    ? {
                        ...player,
                        fullName: form.name.trim(),
                        nickname: form.nickname.trim(),
                        position: form.position,
                        shirt: Number(form.shirt) || 0,
                        avatar: getInitials(form.nickname.trim()),
                        photo: form.photo,
                        bio: form.bio.trim(),
                      }
                    : player,
                ),
              );
              setEditing(false);
              notify('Perfil atualizado.');
            }}
          >
            <Save size={16} />
            Salvar perfil
          </button>
        </div>
      )}

      <div className="panel profile-card player-profile-card">
        <div className="profile-card-head">
          <div>
            <User size={18} />
            <h3>Perfil do Jogador</h3>
          </div>
          <button className="button minimal" type="button" onClick={() => setEditing(true)}>
            <Edit3 size={15} />
            Editar
          </button>
        </div>
        <div className="profile-player-body">
          <div className={`avatar profile-player-avatar ${profilePhoto ? 'has-photo' : ''}`}>
            {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
          </div>
          <div className="profile-player-main">
            <h4>{form.name}</h4>
            <span>{username}</span>
            <div className="profile-info-grid">
              <div>
                <small>Posicao</small>
                <strong>{form.position}</strong>
              </div>
              <div>
                <small>Camisa</small>
                <strong>#{form.shirt}</strong>
              </div>
              <div>
                <small>Status</small>
                <b className="profile-badge blue">{statusLabel}</b>
              </div>
              <div>
                <small>Bio</small>
                <strong>{form.bio || 'Camisa 10 e capitao'}</strong>
              </div>
            </div>
          </div>
        </div>
        <button className="profile-action-row" type="button" onClick={() => setView('performance')}>
          <span>Ver Meu Jogador (estatisticas)</span>
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="panel profile-card team-profile-card">
        <div className="profile-card-head">
          <div>
            <Shield size={18} />
            <h3>Meu Time</h3>
          </div>
          <div className="profile-card-actions">
            <button
              className="button minimal danger"
              type="button"
              onClick={() => {
                setTeamInfo(null);
                setEditingTeam(false);
                notify('Time desvinculado do perfil.');
              }}
            >
              <Trash2 size={15} />
              Excluir
            </button>
            <button
              className="button minimal"
              type="button"
              onClick={() => {
                setTeamForm(teamInfo || { name: '', code: '' });
                setEditingTeam(!editingTeam);
              }}
            >
              <Edit3 size={15} />
              Editar
            </button>
          </div>
        </div>
        {teamInfo ? (
          <div className="team-profile-body">
            <img src={logo} alt="" />
            <div>
              <h4>{teamInfo.name}</h4>
              <span>{teamInfo.code}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">Nenhum time vinculado ao perfil.</div>
        )}
        {editingTeam && (
          <div className="form-grid">
            <Field label="Nome do time" value={teamForm.name} onChange={(name) => setTeamForm({ ...teamForm, name })} />
            <Field label="ID/codigo" value={teamForm.code} onChange={(code) => setTeamForm({ ...teamForm, code })} />
            <button
              className="button primary full"
              type="button"
              onClick={() => {
                if (!teamForm.name.trim() || !teamForm.code.trim()) {
                  notify('Preencha nome e codigo do time.');
                  return;
                }
                setTeamInfo({ name: teamForm.name.trim(), code: teamForm.code.trim() });
                setEditingTeam(false);
                notify('Time atualizado.');
              }}
            >
              <Save size={15} />
              Salvar time
            </button>
          </div>
        )}
        <button className="profile-action-row" type="button" onClick={() => setView('team')}>
          <span>Gerenciar Meu Time</span>
          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}

function Performance({ user, players, setPlayers, notify }) {
  const me = findPlayerForUser(user, players);
  const [stats, setStats] = useState({
    ...me.stats,
    shots: me.stats.shots || 0,
    passes: me.stats.passes || 0,
    yellow: me.stats.yellow || 0,
    red: me.stats.red || 0,
    notes: me.stats.notes || '',
  });

  const updateNumber = (key, value) => {
    setStats({ ...stats, [key]: value === '' ? 0 : Number(value) });
  };

  return (
    <section>
      <SectionHeader eyebrow="Controle pessoal" title="Meu desempenho" />
      <div className="panel performance-player-card">
        <div className="performance-player-copy">
          <strong>{me.nickname}</strong>
          <span>{me.position} | Camisa {me.shirt} | {user.staffRole || roleLabel(user.role)}</span>
        </div>
        <div className="avatar">{me.avatar}</div>
      </div>
      <div className="panel performance-panel">
        <div className="form-grid three performance-grid">
          {[
            ['goals', 'Gols'],
            ['assists', 'Assistencias'],
            ['recoveries', 'Roubadas de bola'],
            ['shots', 'Finalizacoes'],
            ['passes', 'Passes certos'],
            ['matches', 'Partidas'],
            ['wins', 'Vitorias'],
            ['losses', 'Derrotas'],
            ['rating', 'Nota da partida'],
          ].map(([key, label]) => (
            <Field key={key} label={label} type="number" value={stats[key]} onChange={(value) => updateNumber(key, value)} />
          ))}
        </div>
        <label className="field performance-notes">
          <span>Observacoes da partida</span>
          <textarea value={stats.notes} onChange={(event) => setStats({ ...stats, notes: event.target.value })} />
        </label>
        <div className="performance-actions">
          <button
            className="button primary"
            type="button"
            onClick={() => {
              const numericKeys = ['goals', 'assists', 'recoveries', 'shots', 'passes', 'matches', 'wins', 'losses', 'rating'];
              if (numericKeys.some((key) => Number.isNaN(Number(stats[key])) || Number(stats[key]) < 0)) {
                notify('Use apenas numeros validos no desempenho.');
                return;
              }
              if (Number(stats.rating) > 10) {
                notify('A nota da partida deve ser entre 0 e 10.');
                return;
              }
              setPlayers(players.map((player) => (player.id === me.id ? { ...player, stats } : player)));
              notify('Desempenho salvo.');
            }}
          >
            <Save size={16} />
            Salvar desempenho
          </button>
        </div>
      </div>
    </section>
  );
}

function Players({ players, setView, setSelectedPlayerId }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const filtered = players.filter((player) => {
    const matchQuery = `${player.fullName} ${player.nickname}`.toLowerCase().includes(query.toLowerCase());
    const matchFilter = filter === 'Todos' || player.position === filter;
    return matchQuery && matchFilter;
  });

  return (
    <section>
      <SectionHeader eyebrow="Elenco" title="Jogadores cadastrados" />
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador" />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>Todos</option>
          {positions.map((position) => (
            <option key={position}>{position}</option>
          ))}
        </select>
      </div>
      <div className="player-grid">
        {filtered.map((player) => (
          <article className="player-card" key={player.id}>
            <div className="avatar">{player.avatar}</div>
            <div>
              <strong>{player.nickname}</strong>
              <span>{player.fullName}</span>
            </div>
            <div className="player-meta">
              <b>#{player.shirt}</b>
              <small>{player.position}</small>
            </div>
            <button
              className="button minimal"
              type="button"
              onClick={() => {
                setSelectedPlayerId(player.id);
                setView('player-detail');
              }}
            >
              Ver perfil
            </button>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty-state">Nenhum jogador encontrado.</div>}
      </div>
    </section>
  );
}

function Tryouts({ tryouts, setTryouts, notify }) {
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    position: 'Atacante',
    contact: '',
    date: toDateKey(addDays(new Date(), 1)),
    time: '18:00',
    place: 'EA FC 26 | Clubs',
    notes: '',
  });

  const submit = async (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.contact.trim() || !form.date || !form.time) {
      notify('Preencha EA ID, contato, data e horario do teste.');
      return;
    }

    const tryout = {
      id: Date.now(),
      ...form,
      age: Number(form.age) || '',
      status: 'Agendada',
    };

    setTryouts([tryout, ...tryouts]);
    await notifyTryoutCreated(tryout, notify);
    setForm({
      fullName: '',
      age: '',
      position: 'Atacante',
      contact: '',
      date: toDateKey(addDays(new Date(), 1)),
      time: '18:00',
      place: 'EA FC 26 | Clubs',
      notes: '',
    });
  };

  const updateStatus = (id, status) => {
    setTryouts(tryouts.map((tryout) => (tryout.id === id ? { ...tryout, status } : tryout)));
    notify(`Teste marcado como ${status.toLowerCase()}.`);
  };

  return (
    <section>
      <SectionHeader eyebrow="EA Sports FC | Pro Clubs" title="Agendar teste" />
      <div className="tryout-layout">
        <form className="panel tryout-form" onSubmit={submit}>
          <h3>Novo teste no EA FC</h3>
          <div className="form-grid">
            <Field label="EA ID / gamertag" value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} />
            <Field label="Overall" type="number" value={form.age} onChange={(age) => setForm({ ...form, age })} />
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Posicao no jogo</span>
              <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                {gamePositions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <Field label="Contato / Discord" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
          </div>
          <div className="form-grid three">
            <Field label="Data" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
            <Field label="Horario" type="time" value={form.time} onChange={(time) => setForm({ ...form, time })} />
            <Field label="Plataforma / modo" value={form.place} onChange={(place) => setForm({ ...form, place })} />
          </div>
          <label className="field">
            <span>Observacoes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Ex: disponibilidade, estilo de jogo, headset, posicoes secundarias"
            />
          </label>
          <button className="button primary full" type="submit">
            <CalendarDays size={16} />
            Agendar teste
          </button>
        </form>

        <div className="tryout-stack">
          <div className="panel tryout-info">
            <UserPlus size={24} />
            <div>
              <h3>Testes abertos</h3>
              <p>Registre os jogadores interessados e acompanhe os testes do elenco no EA FC.</p>
            </div>
          </div>

          <div className="tryout-list">
            {tryouts.map((tryout) => (
              <article className="tryout-card" key={tryout.id}>
                <div className="avatar">{getInitials(tryout.fullName)}</div>
                <div>
                  <strong>{tryout.fullName}</strong>
                  <span>
                    {tryout.age ? `OVR ${tryout.age} | ` : ''}
                    {tryout.position}
                  </span>
                  <small>
                    {formatDateLabel(tryout.date)} as {tryout.time} | {tryout.place}
                  </small>
                  <small>{tryout.contact}</small>
                  {tryout.notes && <em>{tryout.notes}</em>}
                </div>
                <div className="tryout-actions">
                  <button className={`status ${tryout.status === 'Confirmada' ? 'live' : ''}`} type="button" onClick={() => updateStatus(tryout.id, tryout.status === 'Confirmada' ? 'Agendada' : 'Confirmada')}>
                    {tryout.status}
                  </button>
                  <button
                    className="button minimal danger"
                    type="button"
                    onClick={() => {
                      setTryouts(tryouts.filter((item) => item.id !== tryout.id));
                      notify('Teste removido.');
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))}
            {tryouts.length === 0 && <div className="empty-state">Nenhum teste agendado ainda.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Matches({ matches, setMatches, notify }) {
  return (
    <section>
      <SectionHeader eyebrow="Agenda competitiva" title="Partidas" />
      <div className="match-list">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} setMatches={setMatches} notify={notify} />
        ))}
      </div>
    </section>
  );
}

function Calendar({ matches, setMatches, tryouts = [], notify }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  const [filter, setFilter] = useState('Todos');
  const days = makeCalendarDays(monthDate);
  const monthTitle = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const calendarEvents = buildCalendarEvents(matches, tryouts);
  const selectedEvents = calendarEvents.filter((event) => event.dateKey === selectedDateKey);
  const visibleEvents = filter === 'Todos' ? calendarEvents : calendarEvents.filter((event) => getEventType(event) === filter);
  const selectedDateLabel = formatDateLabel(selectedDateKey);

  const createMatchForDay = async (day) => {
    const match = normalizeMatchEvent({
      id: Date.now(),
      home: 'TorinnoFC',
      away: 'Adversario',
      date: day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      time: '20:00',
      place: 'A definir',
      championship: 'Agenda',
      status: 'Agendada',
      score: '-',
      dateKey: day.key,
      opponentLogo: buildOpponentLogoDataUrl('Adversario'),
    });

    if (isDuplicateMatch(matches, match)) {
      notify('Essa partida ja existe nesse dia e horario.');
      setSelectedDateKey(day.key);
      return;
    }

    setMatches([...matches, match]);
    setSelectedDateKey(day.key);
    await notifyMatchCreated(match, notify);
  };

  const cycleMatchStatus = (matchId) => {
    const flow = ['Agendada', 'Em andamento', 'Encerrada', 'Cancelada'];
    setMatches(
      matches.map((match) => {
        if (match.id !== matchId) return match;
        const nextStatus = flow[(flow.indexOf(match.status) + 1) % flow.length] || 'Agendada';
        return { ...match, status: nextStatus };
      }),
    );
    notify('Status da partida atualizado.');
  };

  const removeMatch = (matchId) => {
    setMatches(matches.filter((match) => match.id !== matchId));
    notify('Partida removida do calendario.');
  };

  return (
    <section>
      <div className="calendar-header">
        <div>
          <SectionHeader eyebrow="Calendario" title={monthTitle} />
          <p>Calendario de partidas e eventos do clube.</p>
        </div>
        <div className="calendar-controls">
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
            <ChevronLeft size={15} />
            Anterior
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              const today = new Date();
              setMonthDate(today);
              setSelectedDateKey(toDateKey(today));
            }}
          >
            Hoje
          </button>
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
            Proximo
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="calendar-toolbar">
        <div className="calendar-legend">
          {['Partida', 'Treino', 'Peneira', 'Interno'].map((type) => (
            <span className={`legend-chip ${type.toLowerCase()}`} key={type}>
              <i />
              {type}
            </span>
          ))}
        </div>
        <div className="calendar-filters">
          {['Todos', 'Partida', 'Treino', 'Peneira', 'Interno'].map((type) => (
            <button className={filter === type ? 'active' : ''} key={type} type="button" onClick={() => setFilter(type)}>
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="calendar-weekdays">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-month">
        {days.map((day) => {
          const dayEvents = visibleEvents.filter((event) => event.dateKey === day.key);
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDateKey === day.key;
          return (
            <button
              className={`${day.currentMonth ? '' : 'muted'} ${day.today ? 'today' : ''} ${hasEvents ? 'has-events' : ''} ${isSelected ? 'selected' : ''}`}
              key={day.key}
              type="button"
              onClick={() => {
                setSelectedDateKey(day.key);
                if (!hasEvents) {
                  createMatchForDay(day);
                }
              }}
            >
              <span className="day-number">
                {day.day}
                {day.today && <em>Hoje</em>}
              </span>
              {dayEvents.slice(0, 2).map((event) => (
                <span className={`calendar-event ${getEventType(event).toLowerCase()}`} key={event.calendarId}>
                  {event.logo ? <img src={event.logo} alt="" /> : <b>{getInitials(event.title)}</b>}
                  <small>
                    <strong>{event.time}</strong>
                    {event.source === 'match' ? event.away : 'Peneira'}
                  </small>
                </span>
              ))}
              {dayEvents.length > 2 && <span className="more-events">+{dayEvents.length - 2}</span>}
            </button>
          );
        })}
      </div>
      <div className="calendar-details">
        <div className="panel selected-day-panel">
          <div className="details-head">
            <div>
              <span>Dia selecionado</span>
              <h3>{selectedDateLabel}</h3>
            </div>
            <button
              className="button primary"
              type="button"
              onClick={() => {
                const [year, month, day] = selectedDateKey.split('-').map(Number);
                createMatchForDay({ key: selectedDateKey, date: new Date(year, month - 1, day) });
              }}
            >
              <Plus size={15} />
              Criar partida
            </button>
          </div>
          <div className="selected-events">
            {selectedEvents.map((event) => (
              <article className={`selected-event-card ${event.source}`} key={event.calendarId}>
                {event.source === 'match' ? (
                  <div className="event-logos" aria-hidden="true">
                    <img src={event.homeLogo || logo} alt="" />
                    <img src={event.logo} alt="" />
                  </div>
                ) : (
                  event.logo ? <img src={event.logo} alt="" /> : <div className="avatar small">{getInitials(event.title)}</div>
                )}
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.subtitle}</span>
                </div>
                <div className="event-actions">
                  <small className={`event-status ${getEventStatus(event).toLowerCase().replace(/\s+/g, '-')}`}>{getEventStatus(event)}</small>
                  {event.source === 'match' && (
                    <>
                      <button className="button minimal small" type="button" onClick={() => cycleMatchStatus(event.id)}>
                        Editar
                      </button>
                      <button className="button minimal small danger" type="button" onClick={() => removeMatch(event.id)}>
                        Remover
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
            {selectedEvents.length === 0 && <div className="empty-state">Nenhum evento nesse dia.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

function Ranking({ players }) {
  const ranked = [...players].sort((a, b) => b.stats.goals + b.stats.assists - (a.stats.goals + a.stats.assists));
  return (
    <section>
      <SectionHeader eyebrow="Ranking" title="Desempenho do time" />
      <div className="ranking-list">
        {ranked.map((player, index) => (
          <article className={`ranking-card top-${index + 1}`} key={player.id}>
            <span className="ranking-number">#{index + 1}</span>
            <div className="avatar">{player.avatar}</div>
            <div>
              <strong>{player.nickname}</strong>
              <span>
                Camisa {player.shirt} | {player.position}
              </span>
            </div>
            <div className="ranking-stat">
              <b>{player.stats.goals + player.stats.assists}</b>
              <small>G+A</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Team({ players }) {
  return (
    <section className="team-page">
      <div className="team-cover">
        <img src={banner} alt="" />
        <div>
          <span>Organizacao esportiva digital</span>
          <h2>TorinnoFC</h2>
          <p>Uma plataforma para alinhar elenco, desempenho, partidas e identidade do clube.</p>
        </div>
      </div>
      <div className="stats-grid compact">
        <StatCard icon={Shield} value="2026" label="Fundacao" />
        <StatCard icon={Users} value={players.length} label="Atletas" />
        <StatCard icon={Trophy} value="3" label="Frentes" />
      </div>
    </section>
  );
}

function Championships({ notify }) {
  return (
    <section>
      <SectionHeader eyebrow="Competicoes" title="Campeonatos" />
      <div className="card-grid">
        {['Liga Premium', 'Copa Digital', 'Amistosos Oficiais'].map((name, index) => (
          <article className="panel" key={name}>
            <Trophy size={24} />
            <h3>{name}</h3>
            <p>{index === 0 ? 'Em andamento' : 'Preparacao'}</p>
            <button className="button minimal" type="button" onClick={() => notify(`${name} aberto.`)}>
              Abrir campeonato
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminPanel({ user, users, setUsers, players, setPlayers, matches, setMatches, notify }) {
  const [newMatch, setNewMatch] = useState({
    away: '',
    date: toDateKey(new Date()),
    time: '',
    opponentLogo: null,
    opponentLogoPreview: '',
  });
  const [newPlayer, setNewPlayer] = useState({ nickname: '', position: 'Atacante', shirt: '11' });
  const playerPositionOptions = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meio-campo', 'Atacante'];

  const handleOpponentLogoChange = async (file) => {
    if (!file) {
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      notify('Use uma imagem PNG, JPG, JPEG ou WEBP.');
      return;
    }

    if (file.size > maxSize) {
      notify('A logo deve ter no maximo 5MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setNewMatch({
        ...newMatch,
        opponentLogo: file,
        opponentLogoPreview: dataUrl,
      });
    } catch {
      notify('Nao foi possivel carregar a logo do adversario.');
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatch.away.trim() || !newMatch.date || !newMatch.time) {
      notify('Preencha adversario, data e hora da partida.');
      return;
    }

    if (!newMatch.opponentLogoPreview) {
      notify('Selecione a logo do adversario.');
      return;
    }

    const matchDate = new Date(`${newMatch.date}T00:00:00`);
    const match = normalizeMatchEvent({
      id: Date.now(),
      home: 'TorinnoFC',
      homeLogo: logo,
      away: newMatch.away.trim(),
      date: formatDateLabel(newMatch.date),
      time: newMatch.time,
      place: 'A definir',
      championship: 'Admin',
      status: 'Agendada',
      score: '-',
      dateKey: toDateKey(matchDate),
      opponentLogo: newMatch.opponentLogoPreview,
      opponentLogoName: newMatch.opponentLogo?.name || '',
    });

    if (isDuplicateMatch(matches, match)) {
      notify('Essa partida ja foi cadastrada nesse dia e horario.');
      return;
    }

    setMatches([...matches, match]);
    await notifyMatchCreated(match, notify);
    setNewMatch({
      away: '',
      date: toDateKey(new Date()),
      time: '',
      opponentLogo: null,
      opponentLogoPreview: '',
    });
  };

  const handleAddPlayer = () => {
    if (!newPlayer.nickname.trim()) {
      notify('Digite o apelido do jogador.');
      return;
    }

    if (!isValidShirtNumber(newPlayer.shirt)) {
      notify('Digite uma camisa valida entre 1 e 999.');
      return;
    }

    if (players.some((player) => player.nickname.toLowerCase() === newPlayer.nickname.trim().toLowerCase())) {
      notify('Ja existe um jogador com esse apelido.');
      return;
    }

    setPlayers([
      ...players,
      {
        id: Date.now(),
        fullName: newPlayer.nickname.trim(),
        nickname: newPlayer.nickname.trim(),
        position: newPlayer.position,
        shirt: Number(newPlayer.shirt),
        foot: 'Direito',
        status: 'Ativo',
        role: 'Jogador',
        avatar: getInitials(newPlayer.nickname),
        bio: 'Novo atleta cadastrado pelo painel admin.',
        stats: { goals: 0, assists: 0, recoveries: 0, matches: 0, wins: 0, losses: 0, rating: 0 },
      },
    ]);
    notify('Jogador cadastrado.');
    setNewPlayer({ nickname: '', position: 'Atacante', shirt: '11' });
  };

  if (user.role !== 'admin') {
    return (
      <section>
        <SectionHeader eyebrow="Administracao" title="Acesso restrito" />
        <div className="panel">
          <ShieldCheck size={24} />
          <h3>Somente administradores</h3>
          <p>Seu perfil esta como {user.staffRole || roleLabel(user.role)}. Peça para um admin liberar seu cargo.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader eyebrow="Administracao" title="Controle do clube" />
      <div className="admin-grid club-control-grid">
        <div className="panel club-control-card">
          <div className="card-title-row">
            <Users size={19} />
            <h3>Cargos e permissoes</h3>
          </div>
          <div className="member-list">
          {users.map((account) => (
            <div className="member-row" key={account.id}>
              <div className="avatar small">{getInitials(account.nickname || account.name)}</div>
              <div className="member-copy">
                <strong>{account.nickname || account.name}</strong>
                <span>{account.email}</span>
              </div>
              <button
                className={`role-badge ${account.role === 'admin' ? 'admin' : 'player'}`}
                type="button"
                onClick={() => {
                  const nextRole = account.role === 'admin' ? 'player' : 'admin';
                  setUsers(
                    users.map((item) =>
                      item.id === account.id
                        ? { ...item, role: nextRole, staffRole: nextRole === 'admin' ? 'Admin' : 'Jogador' }
                        : item,
                    ),
                  );
                  notify(`${account.nickname} agora e ${roleLabel(nextRole)}.`);
                }}
              >
                {roleLabel(account.role)}
              </button>
            </div>
          ))}
          </div>
        </div>
        <div className="panel club-control-card match-control-card">
          <div className="card-title-row">
            <CalendarDays size={19} />
            <h3>Criar partida</h3>
          </div>
          <Field label="Adversario" placeholder="Nome do adversario" value={newMatch.away} onChange={(away) => setNewMatch({ ...newMatch, away })} />
          <div className="form-grid">
            <Field label="Data" type="date" value={newMatch.date} onChange={(date) => setNewMatch({ ...newMatch, date })} />
            <Field label="Hora" type="time" value={newMatch.time} onChange={(time) => setNewMatch({ ...newMatch, time })} />
          </div>
          <label
            className={`logo-upload ${newMatch.opponentLogoPreview ? 'has-preview' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleOpponentLogoChange(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => handleOpponentLogoChange(event.target.files?.[0])}
            />
            {newMatch.opponentLogoPreview ? (
              <img src={newMatch.opponentLogoPreview} alt="Preview da logo do adversario" />
            ) : (
              <div className="upload-placeholder">
                <UploadCloud size={24} />
                <strong>Selecione ou arraste uma imagem aqui</strong>
                <span>PNG, JPG ou WEBP | Max. 5MB</span>
              </div>
            )}
          </label>
          <button
            className="button primary full"
            type="button"
            onClick={handleCreateMatch}
          >
            <Plus size={16} />
            Criar partida
          </button>
        </div>
        <div className="panel club-control-card">
          <div className="card-title-row">
            <UserPlus size={19} />
            <h3>Cadastrar jogador</h3>
          </div>
          <Field label="Apelido" placeholder="Apelido do jogador" value={newPlayer.nickname} onChange={(nickname) => setNewPlayer({ ...newPlayer, nickname })} />
          <label className="field">
            <span>Posicao</span>
            <select value={newPlayer.position} onChange={(event) => setNewPlayer({ ...newPlayer, position: event.target.value })}>
              {playerPositionOptions.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </label>
          <Field label="Camisa" type="number" placeholder="Numero da camisa" value={newPlayer.shirt} onChange={(shirt) => setNewPlayer({ ...newPlayer, shirt })} />
          <button
            className="button primary full"
            type="button"
            onClick={handleAddPlayer}
          >
            <Plus size={16} />
            Adicionar jogador
          </button>
        </div>
      </div>
    </section>
  );
}

const defaultAppSettings = {
  appearance: {
    darkTheme: true,
  },
  notifications: {
    matchAlerts: true,
    newMatch: true,
    newTryout: true,
    newPlayer: true,
    performanceUpdated: true,
    preMatchAlert: true,
  },
  permissions: {
    admin: {
      createMatch: true,
      editMatch: true,
      deleteMatch: true,
      createPlayer: true,
      editPlayer: true,
      removePlayer: true,
      manageCalendar: true,
      manageClubProfile: true,
      sendNotifications: true,
      managePermissions: true,
    },
    player: {
      viewCalendar: true,
      viewMatches: true,
      editOwnPerformance: true,
      viewOwnProfile: true,
      viewTeamInfo: true,
    },
  },
  matches: {
    adminsCreateMatches: true,
    playersSeeFutureMatches: true,
    showOpponentLogo: true,
    showFinishedMatches: true,
    allowEditAfterCreate: true,
  },
  players: {
    adminsCreatePlayers: true,
    playersEditOwnProfile: true,
    playersEditOwnStats: true,
    requirePerformanceApproval: false,
    showShirtOnProfile: true,
    showPositionOnProfile: true,
  },
};

function mergeSettings(saved) {
  return {
    appearance: { ...defaultAppSettings.appearance, ...saved?.appearance },
    notifications: { ...defaultAppSettings.notifications, ...saved?.notifications },
    permissions: {
      admin: { ...defaultAppSettings.permissions.admin, ...saved?.permissions?.admin },
      player: { ...defaultAppSettings.permissions.player, ...saved?.permissions?.player },
    },
    matches: { ...defaultAppSettings.matches, ...saved?.matches },
    players: { ...defaultAppSettings.players, ...saved?.players },
  };
}

function readAppSettings() {
  try {
    return mergeSettings(JSON.parse(localStorage.getItem('torinnofc-settings') || '{}'));
  } catch {
    return defaultAppSettings;
  }
}

function SettingsPage({ user, users, setUsers, notify }) {
  const [settings, setSettings] = useState(readAppSettings);
  const isFounder = user.staffRole === 'Fundador';
  const canManagePermissions = isFounder || (user.role === 'admin' && settings.permissions.admin.managePermissions);

  useEffect(() => {
    localStorage.setItem('torinnofc-settings', JSON.stringify(settings));
    document.documentElement.classList.toggle('light-theme', !settings.appearance.darkTheme);
  }, [settings]);

  const updateSetting = (group, key) => {
    setSettings({
      ...settings,
      [group]: { ...settings[group], [key]: !settings[group][key] },
    });
  };

  const updatePermission = (role, key) => {
    if (!canManagePermissions) {
      notify('Apenas administradores autorizados podem alterar permissoes.');
      return;
    }

    setSettings({
      ...settings,
      permissions: {
        ...settings.permissions,
        [role]: {
          ...settings.permissions[role],
          [key]: !settings.permissions[role][key],
        },
      },
    });
  };

  const updateUserRole = (account, nextStaffRole) => {
    if (!canManagePermissions) {
      notify('Voce nao tem permissao para alterar cargos.');
      return;
    }

    const founderCount = users.filter((item) => item.staffRole === 'Fundador').length;
    if (account.staffRole === 'Fundador' && nextStaffRole !== 'Fundador' && founderCount <= 1) {
      notify('Nao e possivel remover o ultimo fundador.');
      return;
    }

    const nextRole = nextStaffRole === 'Jogador' ? 'player' : 'admin';
    setUsers(
      users.map((item) =>
        item.id === account.id
          ? { ...item, role: nextRole, staffRole: nextStaffRole }
          : item,
      ),
    );
    notify(`${account.nickname} agora e ${nextStaffRole}.`);
  };

  return (
    <section className="settings-page">
      <SectionHeader eyebrow="Preferencias" title="Configuracoes" />

      <SettingsGroup title="Geral">
        <SettingsItem title="Tema escuro" checked={settings.appearance.darkTheme} onChange={() => updateSetting('appearance', 'darkTheme')} />
        <SettingsItem title="Alertas de partidas" checked={settings.notifications.matchAlerts} onChange={() => updateSetting('notifications', 'matchAlerts')} />
        <SettingsItem title="Novas partidas" checked={settings.notifications.newMatch} onChange={() => updateSetting('notifications', 'newMatch')} />
        <SettingsItem title="Novas peneiras" checked={settings.notifications.newTryout} onChange={() => updateSetting('notifications', 'newTryout')} />
      </SettingsGroup>

      <SettingsGroup title="Permissoes">
        {!canManagePermissions && <div className="settings-warning">Apenas Fundador ou Administrador autorizado pode alterar permissoes.</div>}
        <div className="permission-grid">
          <PermissionCard
            title="Fundador"
            description="Acesso total"
            fixed
          />
          <PermissionCard
            title="Admin"
            permissions={settings.permissions.admin}
            labels={{
              createMatch: 'Criar partida',
              editMatch: 'Editar partida',
              createPlayer: 'Cadastrar jogador',
              managePermissions: 'Permissoes',
            }}
            disabled={!canManagePermissions}
            onToggle={(key) => updatePermission('admin', key)}
          />
          <PermissionCard
            title="Jogador"
            permissions={settings.permissions.player}
            labels={{
              viewCalendar: 'Calendario',
              viewMatches: 'Partidas',
              editOwnPerformance: 'Desempenho',
            }}
            disabled={!canManagePermissions}
            onToggle={(key) => updatePermission('player', key)}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Cargos">
        <div className="user-role-list">
          {users.map((account) => (
            <UserRoleRow
              account={account}
              key={account.id}
              disabled={!canManagePermissions}
              onChange={(nextRole) => updateUserRole(account, nextRole)}
            />
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title="Regras">
        <SettingsItem title="Admin cria partidas" checked={settings.matches.adminsCreateMatches} onChange={() => updateSetting('matches', 'adminsCreateMatches')} />
        <SettingsItem title="Agenda para jogadores" checked={settings.matches.playersSeeFutureMatches} onChange={() => updateSetting('matches', 'playersSeeFutureMatches')} />
        <SettingsItem title="Cadastro por admin" checked={settings.players.adminsCreatePlayers} onChange={() => updateSetting('players', 'adminsCreatePlayers')} />
        <SettingsItem title="Jogador edita perfil" checked={settings.players.playersEditOwnProfile} onChange={() => updateSetting('players', 'playersEditOwnProfile')} />
      </SettingsGroup>
    </section>
  );
}

function SettingsGroup({ title, description, children }) {
  return (
    <div className="settings-group">
      <div className="settings-group-head">
        <span>{title}</span>
        {description && <p>{description}</p>}
      </div>
      <div className="settings-group-body">{children}</div>
    </div>
  );
}

function SettingsItem({ title, description, checked, onChange, disabled = false }) {
  return (
    <div className="panel settings-panel">
      <div>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} label={title} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      className={`toggle ${checked ? 'active' : ''}`}
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={onChange}
    />
  );
}

function PermissionCard({ title, description, permissions, labels = {}, fixed = false, disabled = false, onToggle }) {
  return (
    <article className="panel permission-card">
      <div className="permission-card-head">
        <h3>{title}</h3>
        {fixed && <span>Fixo</span>}
      </div>
      {description && <p>{description}</p>}
      {!fixed && (
        <div className="permission-list">
          {Object.entries(labels).map(([key, label]) => (
            <div className="permission-row" key={key}>
              <span>{label}</span>
              <ToggleSwitch checked={permissions[key]} disabled={disabled} onChange={() => onToggle(key)} label={label} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function UserRoleRow({ account, disabled, onChange }) {
  const roleValue = account.staffRole === 'Fundador' ? 'Fundador' : account.role === 'admin' ? 'Administrador' : 'Jogador';
  return (
    <div className="panel user-role-row">
      <div className="avatar small">{getInitials(account.nickname || account.name)}</div>
      <div className="user-role-copy">
        <strong>{account.nickname || account.name}</strong>
        <span>{account.email}</span>
      </div>
      <span className={`role-badge ${roleValue === 'Jogador' ? 'player' : 'admin'}`}>{roleValue}</span>
      <select value={roleValue} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option>Fundador</option>
        <option>Administrador</option>
        <option>Jogador</option>
      </select>
    </div>
  );
}

function PlayerDetail({ players, selectedPlayerId }) {
  const player = players.find((item) => item.id === selectedPlayerId) || players[0];
  return (
    <section className="profile-layout">
      <div className="profile-hero">
        <div className="shirt-number">#{player.shirt}</div>
        <div className="avatar big">{player.avatar}</div>
        <div>
          <span>{player.position}</span>
          <h2>{player.nickname}</h2>
          <p>{player.bio}</p>
        </div>
      </div>
      <div className="stats-grid compact">
        <StatCard icon={Trophy} value={player.stats.goals} label="Gols" />
        <StatCard icon={BarChart3} value={player.stats.assists} label="Assistencias" />
        <StatCard icon={Activity} value={player.stats.recoveries} label="Roubadas" />
        <StatCard icon={Star} value={player.stats.rating} label="Nota media" />
      </div>
    </section>
  );
}

function MatchCard({ match, setMatches, notify }) {
  const normalized = normalizeMatchEvent(match);
  const nextStatus = () => {
    const currentIndex = statusFlow.indexOf(normalized.status);
    const status = statusFlow[(currentIndex + 1) % statusFlow.length];
    setMatches((items) =>
      items.map((item) =>
        item.id === normalized.id
          ? { ...item, status, score: status === 'Encerrada' && item.score === '-' ? '0 x 0' : item.score }
          : item,
      ),
    );
    notify(`Status atualizado para ${status}.`);
  };

  return (
    <article className="match-card">
      <div className="match-logos" aria-hidden="true">
        <img src={normalized.homeLogo} alt="" />
        <img src={normalized.opponentLogo} alt="" />
      </div>
      <div>
        <span>
          {normalized.date} | {normalized.time}
        </span>
        <strong>
          {normalized.home} <em>x</em> {normalized.away}
        </strong>
        <small>
          {normalized.place} | {normalized.championship}
        </small>
      </div>
      <div className="score">{normalized.score}</div>
      <button className={`status ${normalized.status === 'Em andamento' ? 'live' : ''}`} type="button" onClick={nextStatus}>
        {normalized.status}
      </button>
    </article>
  );
}

function TopRanking({ players }) {
  return (
    <div className="panel">
      <h3>Top 3 ranking</h3>
      {players.slice(0, 3).map((player, index) => (
        <div className="top-row" key={player.id}>
          <span>#{index + 1}</span>
          <div className="avatar small">{player.avatar}</div>
          <strong>{player.nickname}</strong>
          <b>{player.stats.rating}</b>
        </div>
      ))}
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="icon-tile blue">
        <Icon size={16} />
      </div>
      <div>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {action && (
        <button className="button minimal small" type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label }) {
  return (
    <article className="stat-card">
      <div className="icon-tile gold">
        <Icon size={16} />
      </div>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div className="section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function getInitials(value = 'TF') {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDateLabel(value) {
  if (!value) {
    return 'Data a definir';
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function getEventType(match) {
  const label = `${match.championship || ''} ${match.type || ''}`.toLowerCase();

  if (label.includes('treino')) return 'Treino';
  if (label.includes('peneira') || label.includes('teste')) return 'Peneira';
  if (label.includes('interno')) return 'Interno';
  return 'Partida';
}

function getEventStatus(match) {
  if (match.status === 'Agendada') return 'Agendada';
  if (match.status === 'Confirmada') return 'Confirmada';
  if (match.status === 'Em andamento') return 'Em andamento';
  if (match.status === 'Encerrada') return 'Finalizada';
  if (match.status === 'Cancelada') return 'Cancelada';
  if (match.status === 'Pendente') return 'Pendente';
  return 'Confirmada';
}

function isDuplicateMatch(matches, nextMatch) {
  return matches.some(
    (match) =>
      match.dateKey === nextMatch.dateKey
      && match.time === nextMatch.time
      && match.away?.trim().toLowerCase() === nextMatch.away?.trim().toLowerCase(),
  );
}

function isValidShirtNumber(value) {
  const shirt = Number(value);
  return Number.isInteger(shirt) && shirt > 0 && shirt <= 999;
}

function pageTitle(view) {
  const map = {
    dashboard: 'Painel',
    profile: 'Meu Perfil',
    performance: 'Meu Desempenho',
    players: 'Jogadores',
    'player-detail': 'Perfil do Jogador',
    tryouts: 'Peneiras',
    matches: 'Partidas',
    calendar: 'Calendario',
    ranking: 'Ranking',
    team: 'Time',
    championships: 'Campeonatos',
    admin: 'Admin',
    settings: 'Configuracoes',
  };
  return map[view] || 'Painel';
}

export default App;
