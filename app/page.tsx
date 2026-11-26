'use client';
import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  House,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownToLine,
  Plus,
  Search,
  Bell,
  ArrowRight,
  X,
  Check,
  Building2,
  CalendarDays,
  Menu,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  type State,
  type Tenant,
  bill,
  money,
  monthNow,
  monthLabel,
  today,
} from '../lib/kos';

type User = { name: string; email: string };
type Modal = { kind: string; data?: Record<string, unknown> };

const pages = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'rooms', label: 'Manajemen kamar', icon: DoorOpen },
  { id: 'tenants', label: 'Data penghuni', icon: Users },
  { id: 'payments', label: 'Pembayaran', icon: Wallet },
  { id: 'bills', label: 'Status pembayaran', icon: ChartNoAxesCombined },
];

const initials = (s: string) =>
  s
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [page, setPage] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Semua');
  const [month, setMonth] = useState(monthNow());
  const [modal, setModal] = useState<Modal | null>(null);
  const [register, setRegister] = useState(false);
  const [mobile, setMobile] = useState(false);

  async function load() {
    const r = await fetch('/api/manage');
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    setUser(d.user);
    setState(d.state || null);
    setVersion(d.version || 0);
  }

  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setMobile(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobile]);

  async function act(action: string, values: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, values, version }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      await load();
      setModal(null);
      if (!['login', 'register', 'demo', 'logout'].includes(action)) {
        setToast('Perubahan berhasil disimpan.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function nav(id: string) {
    setPage(id);
    setSearch('');
    setFilter('Semua');
    setMobile(false);
    setError('');
  }

  function open(kind: string, data?: object) {
    setError('');
    setModal({ kind, data: data as Record<string, unknown> });
  }

  function submit(e: FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    const vals = Object.fromEntries(new FormData(e.currentTarget));
    if (action === 'room') {
      vals.maintenance = (vals.maintenance === 'on') as unknown as string;
    }
    act(action, vals);
  }

  function exportCSV() {
    if (!state) return;
    const rows = [
      ['Tanggal', 'Penghuni', 'Kamar', 'Periode', 'Nominal', 'Metode', 'Catatan'],
      ...state.payments
        .filter((p) => p.month === month)
        .map((p) => {
          const t = state.tenants.find((t) => t.id === p.tenantId);
          return [
            p.date,
            t?.name,
            state.rooms.find((r) => r.id === t?.roomId)?.number,
            p.month,
            p.amount,
            p.method,
            p.note,
          ];
        }),
    ];
    const csv =
      '\uFEFF' +
      rows
        .map((r) =>
          r
            .map(
              (v) =>
                '"' +
                String(v ?? '')
                  .replace(/^[=+@-]/, "'")
                  .replaceAll('"', '""') +
                '"'
            )
            .join(',')
        )
        .join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    );
    a.download = 'laporan-juragankos-' + month + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    setToast('Laporan pembayaran berhasil diunduh.');
  }

  if (loading) {
    return (
      <div className="loading">
        <House size={40} aria-hidden="true" />
        <span>Menyiapkan JuraganKos…</span>
      </div>
    );
  }

  if (!user || !state) {
    return (
      <main className="auth">
        <div className="auth-story">
          <div className="brand">
            <span className="brand-icon">
              <House size={20} aria-hidden="true" />
            </span>
            Juragan<span>Kos</span>
            <i>®</i>
          </div>
          <div>
            <span className="eyebrow">RUMAH BAGI USAHA KOS ANDA</span>
            <h1>
              Kos terkelola.
              <br />
              Pikiran lebih lega.
            </h1>
            <p>
              Dari kamar hingga pembayaran, semua beres dalam satu tempat. Lebih
              sedikit administrasi, lebih banyak waktu untuk Anda.
            </p>
            <div className="auth-illustration" aria-hidden="true">
              <Building2 size={124} strokeWidth={1.15} />
              <div>
                <CheckCircle2 /> Semua dalam kendali
              </div>
              <div>
                <Wallet /> Pencatatan lebih rapi
              </div>
            </div>
          </div>
          <small>© 2026 JuraganKos. Dibuat untuk juragan yang lebih tenang.</small>
        </div>

        <div className="auth-form">
          <span className="tiny-brand">JURAGANKOS / RUANG PENGELOLA</span>
          <h2>{register ? 'Mulai kelola kos Anda' : 'Selamat datang kembali'}</h2>
          <p>
            {register
              ? 'Buat akun pemilik dengan data kos yang kosong.'
              : 'Masuk dan lihat kabar baik dari kos Anda hari ini.'}
          </p>

          <form onSubmit={(e) => submit(e, register ? 'register' : 'login')}>
            {register && (
              <label>
                Nama pemilik
                <input
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="Nama lengkap Anda"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
              />
            </label>
            <label>
              Kata sandi
              <input
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder="Minimal 8 karakter"
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary" type="submit" disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={18} aria-hidden="true" />
              ) : register ? (
                'Buat akun'
              ) : (
                'Masuk ke dashboard'
              )}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          <p className="auth-switch">
            {register ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}{' '}
            <button
              type="button"
              onClick={() => {
                setRegister(!register);
                setError('');
              }}
            >
              {register ? 'Masuk' : 'Daftar sekarang'}
            </button>
          </p>

          <div className="divider">atau lihat dulu</div>

          <button
            type="button"
            className="secondary demo"
            disabled={busy}
            onClick={() => act('demo')}
          >
            Jelajahi dengan data demo{' '}
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>

          <small className="auth-note">
            <ShieldCheck size={15} aria-hidden="true" /> Akun demo terpisah
            dari data kos Anda.
          </small>
        </div>
      </main>
    );
  }

  const active = state.tenants.filter((t) => t.active);
  const occupied = active.length;
  const available = state.rooms.filter(
    (r) => !r.maintenance && !active.some((t) => t.roomId === r.id)
  ).length;
  const eligible = state.tenants.filter(
    (t) =>
      t.start.slice(0, 7) <= month &&
      (t.active ||
        state.payments.some((p) => p.tenantId === t.id && p.month === month))
  );
  const outstanding = eligible.filter((t) => bill(state, t, month).due > 0);
  const received = state.payments
    .filter((p) => p.month === month)
    .reduce((a, p) => a + p.amount, 0);
  const target = eligible.reduce(
    (a, t) => a + (state.rooms.find((r) => r.id === t.roomId)?.price || 0),
    0
  );
  const due = outstanding.reduce(
    (a, t) => a + bill(state, t, month).due,
    0
  );
  const occupancy = state.rooms.length
    ? Math.round((occupied / state.rooms.length) * 100)
    : 0;
  const isDemo = user.email.endsWith('@demo.juragankos.local');
  const title = pages.find((p) => p.id === page)?.label || 'Pengaturan kos';

  function paymentModal(t?: Tenant) {
    open('payment', {
      tenantId: t?.id || outstanding[0]?.id || active[0]?.id || '',
      month,
      date: today(),
      method: 'Transfer bank',
    });
  }

  const matches = (value: string) =>
    value.toLowerCase().includes(search.toLowerCase());

  const badge = (status: string) => (
    <span
      className={
        'badge ' +
        (status === 'Lunas' || status === 'Tersedia'
          ? 'green'
          : status === 'Terisi'
          ? 'blue'
          : status === 'Perawatan'
          ? 'gray'
          : 'amber')
      }
    >
      <i aria-hidden="true" />
      {status}
    </span>
  );

  function tenantRow(t: Tenant) {
    const b = bill(state!, t, month);
    return (
      <tr key={t.id}>
        <td>
          <div className="person">
            <span className="avatar">{initials(t.name)}</span>
            <div>
              <strong>{t.name}</strong>
              <small>{t.phone}</small>
            </div>
          </div>
        </td>
        <td>
          <span className="room-label">{b.room?.number}</span>
        </td>
        <td>{money(b.room?.price || 0)}</td>
        <td>
          {badge(b.due === 0 ? 'Lunas' : b.paid ? 'Sebagian' : 'Belum bayar')}
        </td>
        <td className="align-right">
          <button
            type="button"
            className="text-button"
            onClick={() =>
              b.due ? paymentModal(t) : open('tenantDetail', t)
            }
          >
            {b.due ? 'Catat bayar' : 'Lihat detail'}
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </td>
      </tr>
    );
  }

  const filteredRooms = state.rooms.filter((r) => {
    const status = r.maintenance
      ? 'Perawatan'
      : active.some((t) => t.roomId === r.id)
      ? 'Terisi'
      : 'Tersedia';
    return (
      matches(r.number + ' ' + r.type) &&
      (filter === 'Semua' || status === filter)
    );
  });

  const filteredTenantsOrBills = (
    page === 'tenants' ? state.tenants : eligible
  ).filter(
    (t) =>
      matches(
        t.name + ' ' + state.rooms.find((r) => r.id === t.roomId)?.number
      ) &&
      (filter === 'Semua' ||
        (page === 'tenants'
          ? filter === 'Aktif'
            ? t.active
            : !t.active
          : filter === 'Lunas'
          ? bill(state, t, month).due === 0
          : bill(state, t, month).due > 0))
  );

  const filteredPayments = state.payments
    .filter(
      (p) =>
        p.month === month &&
        matches(state.tenants.find((t) => t.id === p.tenantId)?.name || '') &&
        (filter === 'Semua' || p.method === filter)
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const maxChartAmount = Math.max(target, received, 1000000);
  const maintenanceShare = state.rooms.length
    ? 100 -
      (state.rooms.filter((r) => r.maintenance).length / state.rooms.length) *
        100
    : 100;

  return (
    <div className="app-shell">
      <aside id="app-sidebar" className={'sidebar' + (mobile ? ' open' : '')}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            nav('dashboard');
          }}
        >
          <span className="brand-icon">
            <House size={20} aria-hidden="true" />
          </span>
          <span className="brand-text">
            Juragan<span>Kos</span>
            <i>®</i>
          </span>
        </a>

        <button
          type="button"
          className="property-switch"
          onClick={() => nav('settings')}
        >
          <span className="property-icon">
            <Building2 size={18} aria-hidden="true" />
          </span>
          <span>
            <strong>{state.property}</strong>
            <small>Properti saya</small>
          </span>
          <ChevronDown size={15} aria-hidden="true" />
        </button>

        <span className="nav-label">MENU UTAMA</span>
        <nav aria-label="Navigasi utama">
          {pages.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => nav(p.id)}
              className={page === p.id ? 'active' : ''}
              aria-current={page === p.id ? 'page' : undefined}
            >
              <p.icon size={18} aria-hidden="true" />
              <span>{p.label}</span>
              {p.id === 'bills' && outstanding.length > 0 && (
                <b>{outstanding.length}</b>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <strong>Kelola lebih tenang.</strong>
            <p>Satu tempat untuk seluruh urusan kos Anda.</p>
            <button type="button" onClick={() => open('guide')}>
              Panduan penggunaan{' '}
              <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className={'settings-link ' + (page === 'settings' ? 'selected' : '')}
            onClick={() => nav('settings')}
            aria-current={page === 'settings' ? 'page' : undefined}
          >
            <Settings size={18} aria-hidden="true" />
            <span>Pengaturan</span>
          </button>
        </div>
      </aside>

      {mobile && (
        <div
          className="scrim"
          aria-hidden="true"
          onClick={() => setMobile(false)}
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              type="button"
              className="mobile-menu icon-button"
              aria-label={mobile ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={mobile}
              aria-controls="app-sidebar"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span>Ruang pengelola</span>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{title}</strong>
          </div>

          <div className="top-actions">
            {isDemo && <span className="demo-tag">Mode demo</span>}
            <span className="operational">
              <i aria-hidden="true" /> Sistem aktif
            </span>
            <button
              type="button"
              className="notification icon-button"
              aria-label="Lihat tagihan belum dibayar"
              onClick={() => nav('bills')}
            >
              <Bell size={18} aria-hidden="true" />
              {outstanding.length > 0 && <i aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="avatar owner small profile-trigger"
              aria-label="Akun pengelola dan keluar"
              title={user.name}
              onClick={() => {
                setMobile(false);
                open('profile');
              }}
            >
              {initials(user.name)}
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="overline">
                {page === 'dashboard'
                  ? 'RINGKASAN OPERASIONAL'
                  : 'KELOLA KOS ANDA'}
              </div>
              <h1>
                {page === 'dashboard' ? (
                  <>
                    Selamat datang, {user.name.split(' ')[0]}
                    <Sparkles
                      size={22}
                      className="heading-spark"
                      aria-hidden="true"
                    />
                  </>
                ) : (
                  title
                )}
              </h1>
              <p>
                {page === 'dashboard'
                  ? 'Ini kabar kos Anda hari ini. Semuanya ada dalam kendali.'
                  : page === 'rooms'
                  ? 'Setiap kamar, tercatat dan terkelola dengan baik.'
                  : page === 'tenants'
                  ? 'Kenali penghuni, kelola hunian dengan lebih mudah.'
                  : page === 'payments'
                  ? 'Pencatatan yang rapi untuk setiap pembayaran sewa.'
                  : page === 'bills'
                  ? 'Pantau pelunasan dan tindak lanjuti tagihan sewa.'
                  : 'Sesuaikan informasi properti Anda.'}
              </p>
            </div>

            <div className="heading-actions">
              {page !== 'settings' && (
                <label className="month-picker">
                  <CalendarDays size={16} aria-hidden="true" />
                  <input
                    aria-label="Pilih bulan laporan"
                    type="month"
                    value={month}
                    onChange={(e) => {
                      if (e.target.value) setMonth(e.target.value);
                    }}
                  />
                </label>
              )}
              {page === 'dashboard' || page === 'payments' ? (
                <button
                  type="button"
                  className="secondary"
                  onClick={exportCSV}
                >
                  <ArrowDownToLine size={16} aria-hidden="true" />
                  Unduh laporan
                </button>
              ) : page === 'rooms' || page === 'tenants' ? (
                <button
                  type="button"
                  className="primary"
                  onClick={() => open(page === 'rooms' ? 'room' : 'tenant')}
                >
                  <Plus size={16} aria-hidden="true" />
                  {page === 'rooms' ? 'Tambah kamar' : 'Tambah penghuni'}
                </button>
              ) : null}
            </div>
          </div>

          {error && !modal && (
            <div className="error" role="alert">
              {error}
            </div>
          )}

          {page === 'dashboard' && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="banner-label">
                    <i aria-hidden="true" /> KOS ANDA, LEBIH TERATUR
                  </span>
                  <h2>Usaha berjalan. Anda lebih tenang.</h2>
                  <p>
                    Kelola kamar, penghuni, dan pembayaran dalam satu tempat.
                  </p>
                  <button type="button" onClick={() => paymentModal()}>
                    Catat pembayaran{' '}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <div className="building">
                    <div className="roof" />
                    <div className="windows">
                      {Array.from({ length: 6 }, (_, i) => (
                        <i key={i} />
                      ))}
                    </div>
                    <div className="door" />
                  </div>
                  <span className="art-check">
                    <Check size={18} />
                  </span>
                  <span className="art-plant">
                    <Sparkles size={32} />
                  </span>
                  <span className="art-line" />
                </div>
              </section>

              <div className="stats-grid">
                <Stat
                  icon={<DoorOpen size={20} aria-hidden="true" />}
                  label="Total kamar"
                  value={String(state.rooms.length)}
                  note={
                    <>
                      <span className="positive">{available} tersedia</span>
                      <span>untuk penghuni baru</span>
                    </>
                  }
                />
                <Stat
                  icon={<Users size={20} aria-hidden="true" />}
                  label="Kamar terisi"
                  value={String(occupied)}
                  suffix={'/ ' + state.rooms.length}
                  note={
                    <>
                      <span className="mini-progress">
                        <i style={{ width: occupancy + '%' }} />
                      </span>
                      <span>Okupansi {occupancy}%</span>
                    </>
                  }
                />
                <Stat
                  icon={<Wallet size={20} aria-hidden="true" />}
                  label="Pendapatan bulan ini"
                  value={money(received)}
                  note={
                    <>
                      <span className="positive">
                        <Check size={13} aria-hidden="true" />
                        Tercatat
                      </span>
                      <span>{monthLabel(month)}</span>
                    </>
                  }
                />
                <Stat
                  icon={<Clock size={20} aria-hidden="true" />}
                  label="Menunggu pembayaran"
                  value={money(due)}
                  warning
                  note={
                    <>
                      <span className="warning">
                        {outstanding.length} penghuni
                      </span>
                      <button type="button" onClick={() => nav('bills')}>
                        Lihat tagihan{' '}
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </button>
                    </>
                  }
                />
              </div>

              <div className="overview-grid">
                <section className="panel revenue-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Arus pendapatan</h2>
                      <p>Penerimaan sewa dalam 6 bulan terakhir</p>
                    </div>
                    <span className="chart-legend">
                      <i aria-hidden="true" />
                      Pendapatan
                    </span>
                  </div>
                  <div className="chart">
                    <div className="y-labels">
                      {[1, 0.75, 0.5, 0.25, 0].map((x) => (
                        <span key={x}>
                          {Math.round((maxChartAmount * x) / 1000000)} jt
                        </span>
                      ))}
                    </div>
                    <div className="chart-plot">
                      <div className="chart-grid" aria-hidden="true">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <i key={i} />
                        ))}
                      </div>
                      <div className="bars">
                        {Array.from({ length: 6 }, (_, i) => {
                          const d = new Date(month + '-02');
                          d.setMonth(d.getMonth() - 5 + i);
                          const m = d.toISOString().slice(0, 7);
                          const n = state.payments
                            .filter((p) => p.month === m)
                            .reduce((a, p) => a + p.amount, 0);
                          return (
                            <div className="bar-column" key={m}>
                              <div
                                className={'bar ' + (i === 5 ? 'current' : '')}
                                title={monthLabel(m) + ': ' + money(n)}
                                aria-label={monthLabel(m) + ': ' + money(n)}
                                tabIndex={n > 0 ? 0 : undefined}
                                style={{
                                  height:
                                    Math.max(
                                      n ? 4 : 0,
                                      (n / maxChartAmount) * 160
                                    ) + 'px',
                                }}
                              >
                                {n > 0 && <span>{money(n)}</span>}
                              </div>
                              <small>
                                {d.toLocaleDateString('id-ID', {
                                  month: 'short',
                                })}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="chart-footer">
                    <span>
                      Total penerimaan <strong>{monthLabel(month)}</strong>
                    </span>
                    <strong>
                      {money(received)}{' '}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </strong>
                  </div>
                </section>

                <section className="panel occupancy-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Komposisi kamar</h2>
                      <p>Gambaran hunian saat ini</p>
                    </div>
                    <DoorOpen size={18} aria-hidden="true" />
                  </div>
                  <div
                    className="donut"
                    aria-label={`Tingkat hunian ${occupancy}%`}
                    style={{
                      background: `conic-gradient(#2563EB 0 ${occupancy}%, #93C5FD ${occupancy}% ${maintenanceShare}%, #CBD5E1 0)`,
                    }}
                  >
                    <div>
                      <strong>
                        {occupancy}
                        <small>%</small>
                      </strong>
                      <span>Tingkat hunian</span>
                    </div>
                  </div>
                  <div className="occupancy-legend">
                    <span>
                      <i className="dot dark" aria-hidden="true" />
                      Terisi
                      <strong>{occupied} kamar</strong>
                    </span>
                    <span>
                      <i className="dot light" aria-hidden="true" />
                      Tersedia
                      <strong>{available} kamar</strong>
                    </span>
                    <span>
                      <i className="dot gray" aria-hidden="true" />
                      Perawatan
                      <strong>
                        {state.rooms.filter((r) => r.maintenance).length} kamar
                      </strong>
                    </span>
                  </div>
                </section>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Pantauan pembayaran{' '}
                      <span className="count">
                        {outstanding.length} belum lunas
                      </span>
                    </h2>
                    <p>Sedikit perhatian hari ini, arus kas lebih lancar.</p>
                  </div>
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => nav('bills')}
                  >
                    Lihat semua <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Penghuni</th>
                        <th>Kamar</th>
                        <th>Sewa per bulan</th>
                        <th>Status pembayaran</th>
                        <th className="align-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>{outstanding.slice(0, 4).map(tenantRow)}</tbody>
                  </table>
                  {!outstanding.length && (
                    <Empty text="Semua tagihan sudah beres. Hari yang menyenangkan!" />
                  )}
                </div>
              </section>
            </>
          )}

          {page === 'rooms' && (
            <>
              <div className="compact-stats">
                <span>
                  <i className="dot dark" aria-hidden="true" />
                  {state.rooms.length} total kamar
                </span>
                <span>
                  <i className="dot light" aria-hidden="true" />
                  {available} tersedia
                </span>
                <span>{occupied} terisi</span>
              </div>

              <Toolbar
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
                options={['Semua', 'Tersedia', 'Terisi', 'Perawatan']}
                placeholder="Cari nomor atau tipe kamar…"
              />

              <div className="rooms-grid">
                {filteredRooms.map((r) => {
                  const t = active.find((t) => t.roomId === r.id);
                  const status = r.maintenance
                    ? 'Perawatan'
                    : t
                    ? 'Terisi'
                    : 'Tersedia';
                  return (
                    <section className="panel room-card" key={r.id}>
                      <div className="room-top">
                        <span className="room-big-icon">
                          <DoorOpen size={22} aria-hidden="true" />
                        </span>
                        {badge(status)}
                      </div>
                      <h2>
                        Kamar {r.number}
                        <small>
                          {r.type} · Lantai {r.floor}
                        </small>
                      </h2>
                      <p className="room-price">
                        {money(r.price)}
                        <small> / bulan</small>
                      </p>
                      <p className="facilities">{r.facilities}</p>
                      <div className="room-tenant">
                        {t ? (
                          <>
                            <span className="avatar small">
                              {initials(t.name)}
                            </span>
                            {t.name}
                          </>
                        ) : (
                          <>
                            <Users size={16} aria-hidden="true" />
                            {r.maintenance
                              ? 'Dalam perawatan'
                              : 'Siap untuk penghuni baru'}
                          </>
                        )}
                      </div>
                      <div className="room-actions">
                        <button
                          type="button"
                          onClick={() => open('room', r)}
                        >
                          Edit kamar
                        </button>
                        {!t && !r.maintenance && (
                          <button
                            type="button"
                            onClick={() => open('tenant', { roomId: r.id })}
                          >
                            Isi kamar <Plus size={14} aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={'Hapus kamar ' + r.number}
                          onClick={() => open('deleteRoom', r)}
                        >
                          <X size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>

              {!filteredRooms.length && (
                <Empty text="Tidak ada kamar yang cocok. Tambahkan kamar atau ubah pencarian." />
              )}
            </>
          )}

          {(page === 'tenants' || page === 'bills') && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>
                    {page === 'tenants' ? 'Daftar penghuni' : 'Tagihan sewa'}{' '}
                    <span className="count">
                      {page === 'tenants' ? active.length : eligible.length}{' '}
                      penghuni
                    </span>
                  </h2>
                  <p>
                    {page === 'tenants'
                      ? 'Data penghuni aktif dan riwayat hunian.'
                      : monthLabel(month) +
                        ' · Jatuh tempo tanggal 5 setiap bulan'}
                  </p>
                </div>
                {page === 'bills' && (
                  <button
                    type="button"
                    className="primary"
                    onClick={() => paymentModal()}
                  >
                    <Plus size={16} aria-hidden="true" />
                    Catat pembayaran
                  </button>
                )}
              </div>

              <Toolbar
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
                options={
                  page === 'tenants'
                    ? ['Semua', 'Aktif', 'Checkout']
                    : ['Semua', 'Lunas', 'Belum lunas']
                }
                placeholder="Cari nama penghuni atau kamar…"
              />

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Penghuni</th>
                      <th>Kamar</th>
                      <th>
                        {page === 'tenants' ? 'Tanggal masuk' : 'Sisa tagihan'}
                      </th>
                      <th>Status</th>
                      <th className="align-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenantsOrBills.map((t) => {
                      const b = bill(state, t, month);
                      return (
                        <tr key={t.id}>
                          <td>
                            <div className="person">
                              <span className="avatar">
                                {initials(t.name)}
                              </span>
                              <div>
                                <strong>{t.name}</strong>
                                <small>{t.phone}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="room-label">
                              {b.room?.number}
                            </span>
                          </td>
                          <td>
                            {page === 'tenants'
                              ? new Date(t.start).toLocaleDateString('id-ID')
                              : money(b.due)}
                          </td>
                          <td>
                            {page === 'tenants'
                              ? badge(t.active ? 'Terisi' : 'Checkout')
                              : badge(
                                  b.due === 0
                                    ? 'Lunas'
                                    : b.paid
                                    ? 'Sebagian'
                                    : 'Belum bayar'
                                )}
                          </td>
                          <td className="align-right">
                            <button
                              type="button"
                              className="text-button"
                              onClick={() =>
                                page === 'bills' && b.due
                                  ? paymentModal(t)
                                  : open('tenantDetail', t)
                              }
                            >
                              {page === 'bills' && b.due
                                ? 'Catat bayar'
                                : 'Lihat detail'}
                              <ChevronRight size={14} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <EmptyIfNoRows count={filteredTenantsOrBills.length} />
              </div>
            </section>
          )}

          {page === 'payments' && (
            <>
              <div className="payment-summary">
                <Wallet size={26} aria-hidden="true" />
                <div>
                  <small>Penerimaan {monthLabel(month)}</small>
                  <h2>{money(received)}</h2>
                </div>
                <button
                  type="button"
                  className="primary"
                  onClick={() => paymentModal()}
                >
                  <Plus size={16} aria-hidden="true" />
                  Catat pembayaran
                </button>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Riwayat transaksi</h2>
                    <p>Setiap pembayaran disimpan beserta periode sewanya.</p>
                  </div>
                </div>

                <Toolbar
                  search={search}
                  setSearch={setSearch}
                  filter={filter}
                  setFilter={setFilter}
                  options={['Semua', 'Transfer bank', 'Tunai', 'QRIS']}
                  placeholder="Cari nama penghuni…"
                />

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Penghuni</th>
                        <th>Tanggal</th>
                        <th>Periode</th>
                        <th>Metode</th>
                        <th>Nominal</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map((p) => {
                        const t = state.tenants.find(
                          (t) => t.id === p.tenantId
                        );
                        const roomNum = state.rooms.find(
                          (r) => r.id === t?.roomId
                        )?.number;
                        return (
                          <tr key={p.id}>
                            <td>
                              <strong>{t?.name}</strong>
                              <small className="cell-small">
                                Kamar {roomNum}
                              </small>
                            </td>
                            <td>
                              {new Date(p.date).toLocaleDateString('id-ID')}
                            </td>
                            <td>{monthLabel(p.month)}</td>
                            <td>{p.method}</td>
                            <td>
                              <strong className="positive">
                                {money(p.amount)}
                              </strong>
                            </td>
                            <td className="align-right">
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => open('receipt', p)}
                              >
                                Kuitansi
                                <ArrowUpRight size={14} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <EmptyIfNoRows count={filteredPayments.length} />
                </div>
              </section>
            </>
          )}

          {page === 'settings' && (
            <section className="panel settings-panel">
              <h2>Informasi properti</h2>
              <p>Informasi ini ditampilkan pada dashboard dan kuitansi.</p>
              <form onSubmit={(e) => submit(e, 'settings')}>
                <label>
                  Nama kos
                  <input
                    name="property"
                    required
                    defaultValue={state.property}
                  />
                </label>
                <label>
                  Alamat
                  <textarea name="address" defaultValue={state.address} />
                </label>
                <label>
                  Jatuh tempo pembayaran
                  <input value="Tanggal 5 setiap bulan" readOnly />
                </label>
                <button className="primary" type="submit" disabled={busy}>
                  Simpan pengaturan
                  <Check size={16} aria-hidden="true" />
                </button>
              </form>
            </section>
          )}

          <footer className="page-footer">
            <span>© 2026 JuraganKos</span>
            <span>
              Kelola kos, lebih beres.
              <span className="footer-spark" aria-hidden="true">
                <Sparkles size={14} />
              </span>
            </span>
          </footer>
        </main>
      </div>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          {toast}
        </div>
      )}

      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setModal(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              modal.kind === 'guide'
                ? 'Panduan penggunaan'
                : 'Kelola data kos'
            }
          >
            <button
              type="button"
              className="modal-close icon-button"
              aria-label="Tutup"
              onClick={() => setModal(null)}
            >
              <X size={20} aria-hidden="true" />
            </button>

            {(() => {
              const d = modal.data || {};

              if (modal.kind === 'profile') {
                return (
                  <>
                    <h2>Akun pengelola</h2>
                    <p>
                      {user.name}
                      <br />
                      {isDemo ? 'Akun demo sementara' : user.email}
                    </p>
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      onClick={() => act('logout')}
                    >
                      <LogOut size={16} aria-hidden="true" />
                      Keluar dari akun
                    </button>
                  </>
                );
              }

              if (modal.kind === 'guide') {
                return (
                  <>
                    <span className="overline">MULAI DARI SINI</span>
                    <h2>Kos rapi dalam empat langkah.</h2>
                    <ol className="guide">
                      <li>
                        <strong>Tambahkan kamar</strong>
                        <p>
                          Isi nomor, tipe, fasilitas, dan harga sewa bulanan.
                        </p>
                      </li>
                      <li>
                        <strong>Daftarkan penghuni</strong>
                        <p>
                          Pilih kamar kosong dan lengkapi tanggal masuk serta
                          nomor telepon.
                        </p>
                      </li>
                      <li>
                        <strong>Catat pembayaran</strong>
                        <p>
                          Pilih periode sewa dan nominal. Cicilan akan
                          mengurangi sisa tagihan.
                        </p>
                      </li>
                      <li>
                        <strong>Pantau dashboard</strong>
                        <p>
                          Pantau hunian, pendapatan, dan tagihan. Unduh laporan
                          CSV setiap bulan.
                        </p>
                      </li>
                    </ol>
                    <p className="notice">
                      Tarif bulanan penuh berlaku sejak bulan masuk. Jatuh tempo
                      tanggal 5. Lunasi bulan berjalan sebelum checkout.
                    </p>
                  </>
                );
              }

              if (modal.kind === 'deleteRoom') {
                return (
                  <>
                    <h2>Hapus kamar {String(d.number)}?</h2>
                    <p>
                      Kamar yang memiliki riwayat penghuni tidak bisa dihapus.
                    </p>
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      onClick={() => act('deleteRoom', { id: d.id })}
                    >
                      Hapus kamar
                    </button>
                  </>
                );
              }

              if (modal.kind === 'tenantDetail') {
                const t = d as unknown as Tenant;
                const b = bill(state, t, month);
                return (
                  <>
                    <span className="avatar large">{initials(t.name)}</span>
                    <h2>{t.name}</h2>
                    <p>
                      Kamar {b.room?.number} ·{' '}
                      {t.active ? 'Penghuni aktif' : 'Sudah checkout'}
                    </p>
                    <div className="detail-list">
                      <span>
                        Telepon<strong>{t.phone}</strong>
                      </span>
                      <span>
                        Tanggal masuk<strong>{t.start}</strong>
                      </span>
                      <span>
                        Tagihan {monthLabel(month)}
                        <strong>{money(b.due)}</strong>
                      </span>
                    </div>
                    {t.active && (
                      <div className="modal-actions">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => open('tenant', t)}
                        >
                          Edit penghuni
                        </button>
                        <button
                          type="button"
                          className="primary"
                          onClick={() => paymentModal(t)}
                        >
                          Catat bayar
                        </button>
                        <button
                          type="button"
                          className="danger"
                          disabled={busy}
                          onClick={() => open('checkout', t)}
                        >
                          Checkout
                        </button>
                      </div>
                    )}
                  </>
                );
              }

              if (modal.kind === 'checkout') {
                return (
                  <>
                    <h2>Checkout {String(d.name)}?</h2>
                    <p>
                      Penghuni akan dinonaktifkan dan kamar menjadi tersedia.
                      Riwayat pembayaran tetap tersimpan. Tagihan bulan berjalan
                      harus lunas.
                    </p>
                    <button
                      type="button"
                      className="danger"
                      disabled={busy}
                      onClick={() => act('checkout', { id: d.id })}
                    >
                      Konfirmasi checkout
                    </button>
                  </>
                );
              }

              if (modal.kind === 'receipt') {
                const p = state.payments.find((p) => p.id === d.id);
                if (!p) return null;
                const t = state.tenants.find((t) => t.id === p.tenantId);
                return (
                  <div className="receipt">
                    <span className="brand-icon">
                      <House size={20} aria-hidden="true" />
                    </span>
                    <h2>Kuitansi pembayaran</h2>
                    <p>
                      {state.property}
                      <br />
                      {state.address}
                    </p>
                    <div className="receipt-total">
                      {money(p.amount)}
                      <span className="badge green">Tercatat</span>
                    </div>
                    <div className="detail-list">
                      {[
                        ['Diterima dari', t?.name],
                        [
                          'Kamar',
                          state.rooms.find((r) => r.id === t?.roomId)?.number,
                        ],
                        ['Periode', monthLabel(p.month)],
                        ['Tanggal', p.date],
                        ['Metode', p.method],
                        ['ID transaksi', p.id],
                        ['Catatan', p.note || '—'],
                      ].map(([k, v]) => (
                        <span key={k}>
                          {k}
                          <strong>{v}</strong>
                        </span>
                      ))}
                    </div>
                    <p className="notice">
                      Kuitansi ini membuktikan nominal transaksi yang tercatat.
                      Sisa tagihan periode:{' '}
                      {money(t ? bill(state, t, p.month).due : 0)}.
                    </p>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => window.print()}
                    >
                      <ArrowDownToLine size={16} aria-hidden="true" />
                      Cetak kuitansi
                    </button>
                  </div>
                );
              }

              return (
                <>
                  <span className="overline">{state.property}</span>
                  <h2>
                    {modal.kind === 'room'
                      ? d.id
                        ? 'Edit kamar'
                        : 'Tambah kamar'
                      : modal.kind === 'tenant'
                      ? d.id
                        ? 'Edit penghuni'
                        : 'Tambah penghuni'
                      : 'Catat pembayaran'}
                  </h2>
                  <p>
                    {modal.kind === 'payment'
                      ? 'Catat transaksi sesuai pembayaran yang diterima.'
                      : 'Lengkapi informasi di bawah ini.'}
                  </p>
                  <form
                    key={modal.kind + String(d.id || '')}
                    onSubmit={(e) => submit(e, modal.kind)}
                  >
                    {!!d.id && (
                      <input type="hidden" name="id" value={String(d.id)} />
                    )}

                    {modal.kind === 'room' && (
                      <>
                        <div className="form-grid">
                          <label>
                            Nomor kamar
                            <input
                              name="number"
                              required
                              maxLength={20}
                              defaultValue={String(d.number || '')}
                              placeholder="Contoh: A01"
                              autoFocus
                            />
                          </label>
                          <label>
                            Tipe kamar
                            <select
                              name="type"
                              defaultValue={String(d.type || 'Standard')}
                            >
                              <option>Standard</option>
                              <option>Deluxe</option>
                              <option>Premium</option>
                            </select>
                          </label>
                          <label>
                            Lantai
                            <input
                              name="floor"
                              required
                              defaultValue={String(d.floor || '1')}
                            />
                          </label>
                          <label>
                            Sewa bulanan (Rp)
                            <input
                              type="number"
                              name="price"
                              min="1"
                              step="1"
                              required
                              defaultValue={Number(d.price) || ''}
                              placeholder="1000000"
                            />
                          </label>
                        </div>
                        <label>
                          Fasilitas
                          <textarea
                            name="facilities"
                            defaultValue={String(d.facilities || '')}
                            placeholder="WiFi, AC, kamar mandi dalam"
                          />
                        </label>
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            name="maintenance"
                            defaultChecked={!!d.maintenance}
                          />
                          Kamar dalam perawatan
                        </label>
                      </>
                    )}

                    {modal.kind === 'tenant' && (
                      <>
                        <label>
                          Nama lengkap
                          <input
                            name="name"
                            required
                            maxLength={80}
                            defaultValue={String(d.name || '')}
                            autoFocus
                          />
                        </label>
                        <div className="form-grid">
                          <label>
                            Nomor telepon
                            <input
                              name="phone"
                              type="tel"
                              required
                              pattern="[+0-9 -]{9,18}"
                              defaultValue={String(d.phone || '')}
                              placeholder="081234567890"
                            />
                          </label>
                          <label>
                            Tanggal masuk
                            <input
                              name="start"
                              type="date"
                              required
                              max={today()}
                              defaultValue={String(d.start || today())}
                            />
                          </label>
                        </div>
                        <label>
                          Kamar
                          <select
                            name="roomId"
                            required
                            defaultValue={String(d.roomId || '')}
                          >
                            <option value="">Pilih kamar tersedia</option>
                            {state.rooms
                              .filter(
                                (r) =>
                                  !r.maintenance &&
                                  (!active.some((t) => t.roomId === r.id) ||
                                    r.id === d.roomId)
                              )
                              .map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.number} · {money(r.price)}/bulan
                                </option>
                              ))}
                          </select>
                        </label>
                        {!available && !d.id && (
                          <p className="notice">
                            Belum ada kamar tersedia. Tambahkan kamar terlebih
                            dahulu.
                          </p>
                        )}
                      </>
                    )}

                    {modal.kind === 'payment' && (
                      <>
                        <label>
                          Penghuni
                          <select
                            name="tenantId"
                            required
                            value={String(d.tenantId || '')}
                            onChange={(e) =>
                              setModal({
                                ...modal,
                                data: { ...d, tenantId: e.target.value },
                              })
                            }
                          >
                            <option value="">Pilih penghuni</option>
                            {state.tenants.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name} ·{' '}
                                {
                                  state.rooms.find((r) => r.id === t.roomId)
                                    ?.number
                                }
                                {!t.active ? ' (checkout)' : ''}
                              </option>
                            ))}
                          </select>
                        </label>
                        <div className="form-grid">
                          <label>
                            Periode sewa
                            <input
                              name="month"
                              type="month"
                              required
                              value={String(d.month || month)}
                              onChange={(e) =>
                                setModal({
                                  ...modal,
                                  data: { ...d, month: e.target.value },
                                })
                              }
                            />
                          </label>
                          <label>
                            Tanggal bayar
                            <input
                              name="date"
                              type="date"
                              max={today()}
                              required
                              defaultValue={today()}
                            />
                          </label>
                        </div>
                        <p className="notice">
                          Sisa tagihan:{' '}
                          <strong>
                            {money(
                              state.tenants.find((t) => t.id === d.tenantId)
                                ? bill(
                                    state,
                                    state.tenants.find(
                                      (t) => t.id === d.tenantId
                                    )!,
                                    String(d.month || month)
                                  ).due
                                : 0
                            )}
                          </strong>
                        </p>
                        <div className="form-grid">
                          <label>
                            Nominal (Rp)
                            <input
                              key={String(d.tenantId) + String(d.month)}
                              name="amount"
                              type="number"
                              required
                              min="1"
                              step="1"
                              defaultValue={
                                state.tenants.find((t) => t.id === d.tenantId)
                                  ? bill(
                                      state,
                                      state.tenants.find(
                                        (t) => t.id === d.tenantId
                                      )!,
                                      String(d.month || month)
                                    ).due || ''
                                  : ''
                              }
                            />
                          </label>
                          <label>
                            Metode
                            <select name="method">
                              <option>Transfer bank</option>
                              <option>Tunai</option>
                              <option>QRIS</option>
                            </select>
                          </label>
                        </div>
                        <label>
                          Catatan
                          <input
                            name="note"
                            maxLength={200}
                            placeholder="Opsional"
                          />
                        </label>
                      </>
                    )}

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setModal(null)}
                      >
                        Batal
                      </button>
                      <button className="primary" type="submit" disabled={busy}>
                        {busy
                          ? 'Menyimpan…'
                          : 'Simpan ' +
                            (modal.kind === 'room'
                              ? 'kamar'
                              : modal.kind === 'tenant'
                              ? 'penghuni'
                              : 'pembayaran')}
                        <Check size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </form>
                </>
              );
            })()}

            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
  note,
  warning = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  note: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <section className={'stat-card ' + (warning ? 'warning-card' : '')}>
      <div className="stat-top">
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <h2>
        {value}
        {suffix && <small>{suffix}</small>}
      </h2>
      <div className="stat-note">{note}</div>
    </section>
  );
}

function Toolbar({
  search,
  setSearch,
  filter,
  setFilter,
  options,
  placeholder,
}: {
  search: string;
  setSearch: (s: string) => void;
  filter: string;
  setFilter: (s: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="toolbar">
      <label className="search">
        <Search size={17} aria-hidden="true" />
        <input
          aria-label="Cari data"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      <select
        aria-label="Filter status"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        {options.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Building2 size={30} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function EmptyIfNoRows({ count }: { count: number }) {
  return count ? null : (
    <Empty text="Belum ada data yang cocok dengan pencarian ini." />
  );
}
