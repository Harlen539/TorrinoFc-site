import React, { useEffect, useMemo, useRef, useState } from 'react';
import { hasSupabaseConfig } from './lib/supabaseClient';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
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
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

const logo = '/assets/logo-torrino.png';
const banner = '/assets/banner-torrino.png';
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const RECAPTCHA_PROVIDER = import.meta.env.VITE_RECAPTCHA_PROVIDER || 'classic';
const PRIMARY_RECAPTCHA_PROVIDER = ['auto', 'enterprise'].includes(RECAPTCHA_PROVIDER) ? 'enterprise' : 'classic';
const recaptchaLoaders = {};

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
  return readStorageList('torinnofc-matches', initialMatches);
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
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaResetKey, setRecaptchaResetKey] = useState(0);
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

  const submit = (event) => {
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
    if (!recaptchaToken) {
      setError('Confirme o reCAPTCHA antes de continuar.');
      return;
    }

    const result = onAuth({ ...form, recaptchaToken }, isRegister);
    if (result?.error) {
      setError(result.error);
      setRecaptchaToken('');
      setRecaptchaResetKey((value) => value + 1);
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
          <RecaptchaBox
            resetSignal={recaptchaResetKey}
            onChange={(token) => {
              setRecaptchaToken(token);
              if (token && error === 'Confirme o reCAPTCHA antes de continuar.') {
                setError('');
              }
            }}
          />
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

function loadRecaptchaScript(provider = PRIMARY_RECAPTCHA_PROVIDER) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('reCAPTCHA indisponivel fora do navegador.'));
  }

  const isEnterprise = provider === 'enterprise';
  const readyApi = isEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
  if (readyApi?.render) {
    return Promise.resolve(readyApi);
  }

  if (!recaptchaLoaders[provider]) {
    recaptchaLoaders[provider] = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[data-recaptcha-script="${provider}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(isEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha), { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = isEnterprise
        ? 'https://www.google.com/recaptcha/enterprise.js?render=explicit&hl=pt-BR'
        : 'https://www.google.com/recaptcha/api.js?render=explicit&hl=pt-BR';
      script.async = true;
      script.defer = true;
      script.dataset.recaptchaScript = provider;
      script.onload = () => {
        script.dataset.loaded = 'true';
        const recaptchaApi = isEnterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
        if (recaptchaApi?.ready) {
          recaptchaApi.ready(() => resolve(recaptchaApi));
          return;
        }
        resolve(recaptchaApi);
      };
      script.onerror = () => reject(new Error('Nao foi possivel carregar o reCAPTCHA.'));
      document.head.appendChild(script);
    });
  }

  return recaptchaLoaders[provider];
}

function RecaptchaBox({ onChange, resetSignal }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const widgetProviderRef = useRef(PRIMARY_RECAPTCHA_PROVIDER);
  const onChangeRef = useRef(onChange);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    const renderWidget = (grecaptchaApi, sitekey, fallbackMode = 'primary', provider = PRIMARY_RECAPTCHA_PROVIDER) => {
      if (cancelled || !containerRef.current) {
        return;
      }

      containerRef.current.innerHTML = '';
      widgetIdRef.current = null;
      widgetProviderRef.current = provider;
      setStatus('loading');

      const tryNextMode = () => {
        if (RECAPTCHA_PROVIDER === 'auto' && provider === 'enterprise' && fallbackMode === 'primary') {
          loadRecaptchaScript('classic')
            .then((classicApi) => {
              window.setTimeout(() => renderWidget(classicApi, RECAPTCHA_SITE_KEY, 'classic-same-key', 'classic'), 0);
            })
            .catch(() => {
              setStatus('error');
            });
          return true;
        }

        return false;
      };

      try {
        const widgetOptions = {
          sitekey,
          theme: 'dark',
          callback: (token) => {
            setStatus('ready');
            onChangeRef.current(token);
          },
          'expired-callback': () => {
            setStatus('expired');
            onChangeRef.current('');
          },
          'error-callback': () => {
            onChangeRef.current('');
            if (tryNextMode()) {
              return;
            }
            setStatus('error');
          },
        };

        if (provider === 'enterprise') {
          widgetOptions.action = 'LOGIN';
        }

        widgetIdRef.current = grecaptchaApi.render(containerRef.current, widgetOptions);
        setStatus('ready');
      } catch {
        onChangeRef.current('');
        if (tryNextMode()) {
          return;
        }
        setStatus(provider === 'enterprise' ? 'enterprise-config-error' : 'error');
      }
    };

    if (!RECAPTCHA_SITE_KEY) {
      setStatus('config-error');
      return () => {
        cancelled = true;
      };
    }

    loadRecaptchaScript(PRIMARY_RECAPTCHA_PROVIDER)
      .then((grecaptchaApi) => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) {
          return;
        }

        renderWidget(grecaptchaApi, RECAPTCHA_SITE_KEY, 'primary', PRIMARY_RECAPTCHA_PROVIDER);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          onChangeRef.current('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const recaptchaApi = widgetProviderRef.current === 'enterprise' ? window.grecaptcha?.enterprise : window.grecaptcha;
    if (widgetIdRef.current === null || !recaptchaApi?.reset) {
      return;
    }

    recaptchaApi.reset(widgetIdRef.current);
    onChangeRef.current('');
  }, [resetSignal]);

  return (
    <div className="recaptcha-panel">
      <div ref={containerRef} className="recaptcha-widget" />
      {status === 'loading' && <span>Carregando reCAPTCHA oficial...</span>}
      {status === 'expired' && <span>reCAPTCHA expirou. Confirme novamente.</span>}
      {status === 'error' && <span>Nao foi possivel carregar o reCAPTCHA oficial. Recarregue a pagina ou confira o dominio da chave.</span>}
      {status === 'config-error' && <span>Adicione a chave publica do reCAPTCHA v2 no arquivo .env.</span>}
      {status === 'enterprise-config-error' && <span>A chave precisa ser uma chave de caixa de selecao do reCAPTCHA Enterprise.</span>}
    </div>
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
          {navItems.map((item) => {
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
    settings: <SettingsPage notify={props.notify} />,
  };

  return pages[view] || <Dashboard {...props} />;
}

function Dashboard({ user, players, matches, tryouts, setView, setMatches, notify }) {
  const me = findPlayerForUser(user, players);
  const totals = useMemo(
    () => ({
      goals: players.reduce((sum, player) => sum + player.stats.goals, 0),
      assists: players.reduce((sum, player) => sum + player.stats.assists, 0),
      recoveries: players.reduce((sum, player) => sum + player.stats.recoveries, 0),
      rating: players.length ? (players.reduce((sum, player) => sum + player.stats.rating, 0) / players.length).toFixed(1) : '0.0',
    }),
    [players],
  );

  return (
    <div className="page-grid">
      <section className="main-column">
        <div className="profile-hero compact-hero">
          <div className="avatar big">{getInitials(user.nickname || user.name)}</div>
          <div>
            <span>{user.staffRole || roleLabel(user.role)}</span>
            <h2>Bem-vindo, {user.nickname || user.name}</h2>
            <p>
              Seu painel carregou camisa {me?.shirt || user.shirt}, posicao {me?.position || user.position} e todos os dados salvos do seu uso.
            </p>
          </div>
          <button className="button secondary" type="button" onClick={() => setView('profile')}>
            Meu perfil
          </button>
        </div>
        <SectionHeader eyebrow="Painel oficial" title="Resumo competitivo" />
        <div className="stats-grid">
          <StatCard icon={Star} value={me?.stats?.rating || 0} label="Minha media" />
          <StatCard icon={Flag} value={matches.length} label="Partidas" />
          <StatCard icon={Users} value={players.length} label="Jogadores" />
          <StatCard icon={UserPlus} value={tryouts.length} label="Testes EA FC" />
          <StatCard icon={Trophy} value={totals.goals} label="Gols" />
          <StatCard icon={BarChart3} value={totals.assists} label="Assistencias" />
          <StatCard icon={Star} value={totals.rating} label="Media geral" />
        </div>

        <SectionHeader eyebrow="Hoje" title="Partidas do dia" />
        <div className="match-list">
          {matches.slice(0, 2).map((match) => (
            <MatchCard key={match.id} match={match} setMatches={setMatches} notify={notify} />
          ))}
        </div>
      </section>

      <aside className="side-column">
        <div className="spotlight-card">
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

function Profile({ user, setUser, users, setUsers, players, setPlayers, notify }) {
  const base = findPlayerForUser(user, players);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || base.fullName,
    nickname: user.nickname || base.nickname,
    position: user.position || base.position,
    shirt: user.shirt || base.shirt,
    bio: base.bio,
  });

  return (
    <section className="profile-layout">
      <div className="profile-hero">
        <div className="shirt-number">#{form.shirt}</div>
        <div className="avatar big">{getInitials(form.nickname)}</div>
        <div>
          <span>{form.position} | {user.staffRole || roleLabel(user.role)}</span>
          <h2>{form.nickname}</h2>
          <p>{form.bio}</p>
        </div>
        <button className="button secondary" type="button" onClick={() => setEditing(!editing)}>
          <Edit3 size={16} />
          Editar perfil
        </button>
      </div>

      {editing && (
        <div className="panel">
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
              const nextUser = {
                ...user,
                name: form.name,
                nickname: form.nickname,
                position: form.position,
                shirt: form.shirt,
              };
              setUser(nextUser);
              setUsers(users.map((item) => (item.id === user.id ? { ...item, ...nextUser } : item)));
              setPlayers(
                players.map((player) =>
                  player.id === base.id
                    ? {
                        ...player,
                        fullName: form.name,
                        nickname: form.nickname,
                        position: form.position,
                        shirt: Number(form.shirt) || 0,
                        avatar: getInitials(form.nickname),
                        bio: form.bio,
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

      <div className="stats-grid compact">
        <StatCard icon={Trophy} value={base.stats.goals} label="Gols" />
        <StatCard icon={BarChart3} value={base.stats.assists} label="Assistencias" />
        <StatCard icon={Activity} value={base.stats.recoveries} label="Roubadas" />
        <StatCard icon={Star} value={base.stats.rating} label="Nota media" />
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
    setStats({ ...stats, [key]: Number(value) });
  };

  return (
    <section>
      <SectionHeader eyebrow="Controle pessoal" title="Meu desempenho" />
      <div className="panel settings-panel">
        <div>
          <strong>{me.nickname}</strong>
          <span>{me.position} | Camisa {me.shirt} | {user.staffRole || roleLabel(user.role)}</span>
        </div>
        <div className="avatar">{me.avatar}</div>
      </div>
      <div className="panel">
        <div className="form-grid three">
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
        <label className="field">
          <span>Observacoes da partida</span>
          <textarea value={stats.notes} onChange={(event) => setStats({ ...stats, notes: event.target.value })} />
        </label>
        <div className="button-row">
          <button
            className="button primary"
            type="button"
            onClick={() => {
              setPlayers(players.map((player) => (player.id === me.id ? { ...player, stats } : player)));
              notify('Desempenho salvo.');
            }}
          >
            <Save size={16} />
            Salvar desempenho
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setStats({ ...stats, matches: stats.matches + 1, rating: 0, notes: '' });
              notify('Nova partida adicionada ao desempenho.');
            }}
          >
            <Plus size={16} />
            Adicionar partida
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

  const submit = (event) => {
    event.preventDefault();
    if (!form.fullName.trim() || !form.contact.trim() || !form.date || !form.time) {
      notify('Preencha EA ID, contato, data e horario do teste.');
      return;
    }

    setTryouts([
      {
        id: Date.now(),
        ...form,
        age: Number(form.age) || '',
        status: 'Agendada',
      },
      ...tryouts,
    ]);
    notify('Teste EA FC agendado.');
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

function Calendar({ matches, setMatches, notify }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const days = makeCalendarDays(monthDate);
  const monthTitle = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <section>
      <div className="section-row">
        <SectionHeader eyebrow="Calendario" title={monthTitle} />
        <div className="button-row tight">
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
            Anterior
          </button>
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date())}>
            Hoje
          </button>
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
            Proximo
          </button>
        </div>
      </div>
      <div className="calendar-weekdays">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-month">
        {days.map((day) => {
          const dayMatches = matches.filter((match) => match.dateKey === day.key);
          return (
            <button
              className={`${day.currentMonth ? '' : 'muted'} ${day.today ? 'today' : ''}`}
              key={day.key}
              type="button"
              onClick={() => {
                setMatches([
                  ...matches,
                  {
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
                  },
                ]);
                notify(`Partida criada em ${day.date.toLocaleDateString('pt-BR')}.`);
              }}
            >
              <strong>{day.day}</strong>
              {dayMatches.slice(0, 2).map((match) => (
                <small key={match.id}>{match.time} {match.away}</small>
              ))}
              {dayMatches.length > 2 && <em>+{dayMatches.length - 2}</em>}
            </button>
          );
        })}
      </div>
      <div className="panel">
        {matches.map((match) => (
          <div className="timeline-item" key={match.id}>
            <Clock3 size={17} />
            <div>
              <strong>
                {match.home} x {match.away}
              </strong>
              <span>
                {match.date}, {match.time} | {match.place}
              </span>
            </div>
          </div>
        ))}
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
  const [newMatch, setNewMatch] = useState({ away: '', time: '', place: '' });
  const [newPlayer, setNewPlayer] = useState({ nickname: '', position: 'Atacante', shirt: '11' });

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
      <div className="admin-grid">
        <div className="panel">
          <h3>Cargos e permissoes</h3>
          {users.map((account) => (
            <div className="approval-row" key={account.id}>
              <div>
                <strong>{account.nickname}</strong>
                <span>{account.staffRole || roleLabel(account.role)} | {account.email}</span>
              </div>
              <div className="inline-actions">
                <button
                  className={`status ${account.role === 'admin' ? 'live' : ''}`}
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
            </div>
          ))}
        </div>
        <div className="panel">
          <h3>Criar partida</h3>
          <Field label="Adversario" value={newMatch.away} onChange={(away) => setNewMatch({ ...newMatch, away })} />
          <Field label="Horario" value={newMatch.time} onChange={(time) => setNewMatch({ ...newMatch, time })} />
          <Field label="Local" value={newMatch.place} onChange={(place) => setNewMatch({ ...newMatch, place })} />
          <button
            className="button primary full"
            type="button"
            onClick={() => {
              if (!newMatch.away) return;
              setMatches([
                ...matches,
                {
                  id: Date.now(),
                  home: 'TorinnoFC',
                  away: newMatch.away,
                  date: 'Hoje',
                  time: newMatch.time || '20:00',
                  place: newMatch.place || 'A definir',
                  championship: 'Admin',
                  status: 'Agendada',
                  score: '-',
                  dateKey: toDateKey(new Date()),
                },
              ]);
              notify('Partida criada.');
              setNewMatch({ away: '', time: '', place: '' });
            }}
          >
            <Plus size={16} />
            Criar partida
          </button>
        </div>
        <div className="panel">
          <h3>Cadastrar jogador</h3>
          <Field label="Apelido" value={newPlayer.nickname} onChange={(nickname) => setNewPlayer({ ...newPlayer, nickname })} />
          <label className="field">
            <span>Posicao</span>
            <select value={newPlayer.position} onChange={(event) => setNewPlayer({ ...newPlayer, position: event.target.value })}>
              {positions.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </label>
          <Field label="Camisa" type="number" value={newPlayer.shirt} onChange={(shirt) => setNewPlayer({ ...newPlayer, shirt })} />
          <button
            className="button primary full"
            type="button"
            onClick={() => {
              if (!newPlayer.nickname.trim()) return;
              setPlayers([
                ...players,
                {
                  id: Date.now(),
                  fullName: newPlayer.nickname,
                  nickname: newPlayer.nickname,
                  position: newPlayer.position,
                  shirt: Number(newPlayer.shirt) || 0,
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
            }}
          >
            <Plus size={16} />
            Adicionar jogador
          </button>
        </div>
        <div className="panel">
          <h3>Validar estatisticas</h3>
          {players.map((player) => (
            <div className="approval-row" key={player.id}>
              <span>{player.nickname}</span>
              <div className="inline-actions">
                <button className="button minimal" type="button" onClick={() => notify(`Estatisticas de ${player.nickname} validadas.`)}>
                <CheckCircle2 size={15} />
                Validar
              </button>
                <button
                  className="button minimal danger"
                  type="button"
                  onClick={() => {
                    setPlayers(players.filter((item) => item.id !== player.id));
                    notify(`${player.nickname} removido.`);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SettingsPage({ notify }) {
  const [settings, setSettings] = useState({ notifications: true, dark: true });
  const toggle = (key, label) => {
    setSettings({ ...settings, [key]: !settings[key] });
    notify(`${label} ${settings[key] ? 'desativado' : 'ativado'}.`);
  };

  return (
    <section>
      <SectionHeader eyebrow="Preferencias" title="Configuracoes" />
      <div className="panel settings-panel">
        <div>
          <strong>Notificacoes de partidas</strong>
          <span>Receber alertas antes dos jogos.</span>
        </div>
        <button className={`toggle ${settings.notifications ? 'active' : ''}`} type="button" aria-label="Ativar notificacoes" onClick={() => toggle('notifications', 'Notificacoes')} />
      </div>
      <div className="panel settings-panel">
        <div>
          <strong>Tema premium dark</strong>
          <span>Visual oficial do TorinnoFC.</span>
        </div>
        <button className={`toggle ${settings.dark ? 'active' : ''}`} type="button" aria-label="Ativar tema" onClick={() => toggle('dark', 'Tema dark')} />
      </div>
      <div className="panel settings-panel">
        <div>
          <strong>Banco de dados</strong>
          <span>{hasSupabaseConfig ? 'Supabase conectado.' : 'Aguardando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'}</span>
        </div>
        <button className={`status ${hasSupabaseConfig ? 'live' : ''}`} type="button" onClick={() => notify(hasSupabaseConfig ? 'Banco pronto para integrar.' : 'Adicione as chaves no arquivo .env.')}>
          {hasSupabaseConfig ? 'Conectado' : 'Configurar'}
        </button>
      </div>
    </section>
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
  const nextStatus = () => {
    const currentIndex = statusFlow.indexOf(match.status);
    const status = statusFlow[(currentIndex + 1) % statusFlow.length];
    setMatches((items) =>
      items.map((item) =>
        item.id === match.id
          ? { ...item, status, score: status === 'Encerrada' && item.score === '-' ? '0 x 0' : item.score }
          : item,
      ),
    );
    notify(`Status atualizado para ${status}.`);
  };

  return (
    <article className="match-card">
      <div>
        <span>
          {match.date} | {match.time}
        </span>
        <strong>
          {match.home} <em>x</em> {match.away}
        </strong>
        <small>
          {match.place} | {match.championship}
        </small>
      </div>
      <div className="score">{match.score}</div>
      <button className={`status ${match.status === 'Em andamento' ? 'live' : ''}`} type="button" onClick={nextStatus}>
        {match.status}
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

function StatCard({ icon: Icon, value, label }) {
  return (
    <article className="stat-card">
      <Icon size={20} />
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

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
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
