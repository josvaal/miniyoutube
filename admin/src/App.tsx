import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/admin';

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
};

type User = {
  id?: string;
  username?: string;
  email?: string;
  channelName?: string;
  avatarURL?: string;
  createdAt?: string;
};

type Video = {
  id?: string;
  title?: string;
  description?: string;
  creator?: User;
  privacyStatus?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  createdAt?: string;
};

type Comment = {
  id?: string;
  body?: string;
  user?: User;
  video?: Video;
  createdAt?: string;
};

type Subscription = {
  id?: string;
  subscriber?: User;
  channel?: User;
};

type Reaction = {
  id?: string;
  type?: string;
  user?: User;
  video?: Video;
};

type View = {
  id?: string;
  userId?: string;
  videoId?: string;
  viewedAt?: string;
};

type MetricSummary = {
  users?: number;
  videos?: number;
};

function useAuthStorage() {
  const [username, setUsername] = useState<string>(() => localStorage.getItem('adminUser') || '');
  const [password, setPassword] = useState<string>(() => localStorage.getItem('adminPass') || '');

  const authHeader = useMemo(() => {
    if (!username || !password) return null;
    return 'Basic ' + btoa(`${username}:${password}`);
  }, [username, password]);

  const save = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    localStorage.setItem('adminUser', u);
    localStorage.setItem('adminPass', p);
  };

  const clear = () => {
    setUsername('');
    setPassword('');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminPass');
  };

  return { username, password, authHeader, save, clear };
}

async function apiFetch<T>(path: string, authHeader: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return res.json();
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</p>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function VideosSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Video>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<Video>>(`/videos?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/videos`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/videos/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Videos" description="Gestión completa de videos (creador, urls, privacidad).">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="Título"
          value={form.title || ''}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400"
        />
        <input
          placeholder="creatorId"
          value={form.creatorId || ''}
          onChange={(e) => setForm({ ...form, creatorId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400"
        />
        <input
          placeholder="thumbnailUrl"
          value={form.thumbnailUrl || ''}
          onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400"
        />
        <input
          placeholder="videoUrl / hls"
          value={form.videoUrl || ''}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400"
        />
        <select
          value={form.privacyStatus || ''}
          onChange={(e) => setForm({ ...form, privacyStatus: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400"
        >
          <option value="">Privacidad</option>
          <option value="PUBLIC">PUBLIC</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="UNLISTED">UNLISTED</option>
        </select>
        <input
          placeholder="Tags (coma)"
          value={form.tags || ''}
          onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t: string) => t.trim()) })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-orange-400 sm:col-span-2"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-2"
        >
          Crear video
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Título</th>
              <th className="px-3 py-2">Creador</th>
              <th className="px-3 py-2">Privacidad</th>
              <th className="px-3 py-2">Creado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((v) => (
              <tr key={v.id} className="border-b border-white/5">
                <td className="px-3 py-2 font-semibold">{v.title}</td>
                <td className="px-3 py-2 text-slate-300">{v.creator?.username || v.creator?.id || '—'}</td>
                <td className="px-3 py-2">
                  <Pill>{v.privacyStatus || '—'}</Pill>
                </td>
                <td className="px-3 py-2 text-slate-400">{formatDate(v.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}

function CommentsSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Comment>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<Comment>>(`/comments?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/comments`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/comments/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Comentarios" description="Gestiona los comentarios y respuestas.">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="videoId"
          value={form.videoId || ''}
          onChange={(e) => setForm({ ...form, videoId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400"
        />
        <input
          placeholder="userId"
          value={form.userId || ''}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400"
        />
        <input
          placeholder="parentId (opcional)"
          value={form.parentId || ''}
          onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400"
        />
        <input
          placeholder="Contenido"
          value={form.body || ''}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-blue-400 sm:col-span-2"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-2"
        >
          Crear comentario
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Texto</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Video</th>
              <th className="px-3 py-2">Creado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((c) => (
              <tr key={c.id} className="border-b border-white/5">
                <td className="px-3 py-2 text-sm">{c.body}</td>
                <td className="px-3 py-2 text-slate-300">{c.user?.username || c.user?.id || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{c.video?.title || c.video?.id || '—'}</td>
                <td className="px-3 py-2 text-slate-400">{formatDate(c.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}

function SubscriptionsSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Subscription>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<Subscription>>(`/subscriptions?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/subscriptions`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/subscriptions/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Suscripciones" description="Gestiona relaciones de suscriptor y canal.">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="subscriberId"
          value={form.subscriberId || ''}
          onChange={(e) => setForm({ ...form, subscriberId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
        />
        <input
          placeholder="channelId"
          value={form.channelId || ''}
          onChange={(e) => setForm({ ...form, channelId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-emerald-400"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-2"
        >
          Crear suscripción
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Suscriptor</th>
              <th className="px-3 py-2">Canal</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((s) => (
              <tr key={s.id} className="border-b border-white/5">
                <td className="px-3 py-2 text-slate-300">{s.subscriber?.username || s.subscriber?.id || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{s.channel?.username || s.channel?.id || '—'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}

function ReactionsSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<Reaction>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<Reaction>>(`/reactions?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/reactions`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/reactions/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Reacciones" description="Likes y dislikes de los usuarios.">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="videoId"
          value={form.videoId || ''}
          onChange={(e) => setForm({ ...form, videoId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-pink-400"
        />
        <input
          placeholder="userId"
          value={form.userId || ''}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-pink-400"
        />
        <select
          value={form.type || ''}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-pink-400"
        >
          <option value="">Tipo</option>
          <option value="LIKE">LIKE</option>
          <option value="DISLIKE">DISLIKE</option>
        </select>
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-1"
        >
          Crear reacción
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Video</th>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((r) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="px-3 py-2 text-slate-300">{r.video?.title || r.video?.id || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{r.user?.username || r.user?.id || '—'}</td>
                <td className="px-3 py-2">
                  <Pill>{r.type || '—'}</Pill>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}

function ViewsSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<View>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<View>>(`/views?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/views`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/views/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Vistas" description="Historial de vistas por usuario y video.">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="userId"
          value={form.userId || ''}
          onChange={(e) => setForm({ ...form, userId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400"
        />
        <input
          placeholder="videoId"
          value={form.videoId || ''}
          onChange={(e) => setForm({ ...form, videoId: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-cyan-400"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-1"
        >
          Registrar vista
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Video</th>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((v) => (
              <tr key={v.id} className="border-b border-white/5">
                <td className="px-3 py-2 text-slate-300">{v.userId || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{v.videoId || '—'}</td>
                <td className="px-3 py-2 text-slate-400">{formatDate(v.viewedAt)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}

function MetricsSection({ authHeader }: { authHeader: string }) {
  const [metrics, setMetrics] = useState<MetricSummary>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<MetricSummary>('/metrics/summary', authHeader);
      setMetrics(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SectionCard title="Estado" description="Ping y conteos rápidos.">
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass rounded-xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Usuarios</p>
          <p className="text-3xl font-semibold text-white">{metrics.users ?? '—'}</p>
        </div>
        <div className="glass rounded-xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Videos</p>
          <p className="text-3xl font-semibold text-white">{metrics.videos ?? '—'}</p>
        </div>
        <div className="glass rounded-xl border border-white/10 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Backend</p>
          <p className="text-sm text-emerald-300">{loading ? 'Actualizando...' : 'OK'}</p>
        </div>
      </div>
      <div className="mt-4">
        <button onClick={load} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
          Refrescar
        </button>
      </div>
    </SectionCard>
  );
}

const tabs = [
  { key: 'metrics', label: 'Resumen' },
  { key: 'users', label: 'Usuarios' },
  { key: 'videos', label: 'Videos' },
  { key: 'comments', label: 'Comentarios' },
  { key: 'subscriptions', label: 'Suscripciones' },
  { key: 'reactions', label: 'Reacciones' },
  { key: 'views', label: 'Vistas' },
];

function AdminApp({ authHeader, onLogout }: { authHeader: string; onLogout: () => void }) {
  const [active, setActive] = useState('metrics');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="grid min-h-screen grid-cols-[240px_1fr] gap-0">
        <aside className="glass relative flex flex-col border-r border-white/10 p-4">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Admin</div>
            <div className="text-lg font-semibold text-white">MiniTube</div>
          </div>
          <nav className="flex-1 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  active === t.key ? 'bg-white/10 text-white shadow' : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button
            onClick={onLogout}
            className="mt-4 w-full rounded-xl border border-red-500/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            Cerrar sesión
          </button>
        </aside>
        <main className="relative p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,0,122,0.08),transparent_35%)]"></div>
          <div className="relative space-y-6">
            {active === 'metrics' && <MetricsSection authHeader={authHeader} />}
            {active === 'users' && <UsersSection authHeader={authHeader} />}
            {active === 'videos' && <VideosSection authHeader={authHeader} />}
            {active === 'comments' && <CommentsSection authHeader={authHeader} />}
            {active === 'subscriptions' && <SubscriptionsSection authHeader={authHeader} />}
            {active === 'reactions' && <ReactionsSection authHeader={authHeader} />}
            {active === 'views' && <ViewsSection authHeader={authHeader} />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const { authHeader, save, clear } = useAuthStorage();

  if (!authHeader) {
    return <LoginView onLogin={save} />;
  }

  return <AdminApp authHeader={authHeader} onLogout={clear} />;
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300 ring-1 ring-white/10">{children}</span>;
}

function formatDate(date?: string) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString();
}

function LoginView({ onLogin }: { onLogin: (u: string, p: string) => void }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: u, password: p }),
      });
      if (!res.ok) {
        throw new Error('Credenciales inválidas');
      }
      onLogin(u, p);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 px-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.35em] text-slate-300 ring-1 ring-white/10">
            Admin Console
          </div>
          <h1 className="text-4xl font-semibold text-white">Panel administrativo</h1>
          <p className="text-slate-400">Gestiona usuarios, videos, comentarios y más con una sola cuenta.</p>
        </div>
        <form onSubmit={handleLogin} className="glass w-full max-w-lg space-y-4 rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Usuario</label>
            <input
              value={u}
              onChange={(e) => setU(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none ring-1 ring-transparent focus:ring-red-400"
              placeholder="admin_user"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Contraseña</label>
            <input
              type="password"
              value={p}
              onChange={(e) => setP(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none ring-1 ring-transparent focus:ring-red-400"
              placeholder="••••••"
            />
          </div>
          {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
          <p className="text-center text-xs text-slate-400">Usa las credenciales del backend admin (Basic Auth).</p>
        </form>
      </div>
    </div>
  );
}

function Paginator({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <button
        className="rounded-lg border border-white/10 px-3 py-1 hover:border-white/30 disabled:opacity-40"
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page <= 0}
      >
        Anterior
      </button>
      <span>
        Página {page + 1} de {Math.max(totalPages, 1)}
      </span>
      <button
        className="rounded-lg border border-white/10 px-3 py-1 hover:border-white/30 disabled:opacity-40"
        onClick={() => onChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
      >
        Siguiente
      </button>
    </div>
  );
}

function UsersSection({ authHeader }: { authHeader: string }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PageResponse<User>>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<User>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<PageResponse<User>>(`/users?page=${page}&size=10`, authHeader);
      setData(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch<User>(`/users`, authHeader, { method: 'POST', body: JSON.stringify(form) });
      setForm({});
      setPage(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    setLoading(true);
    try {
      await apiFetch(`/users/${id}`, authHeader, { method: 'DELETE' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard title="Usuarios" description="Crea, lista y elimina cuentas de la aplicación.">
      <div className="mb-4 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input
          placeholder="username"
          value={form.username || ''}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-red-400"
        />
        <input
          placeholder="email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-red-400"
        />
        <input
          placeholder="contraseña"
          type="password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-red-400"
        />
        <input
          placeholder="channelName"
          value={form.channelName || ''}
          onChange={(e) => setForm({ ...form, channelName: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-red-400"
        />
        <input
          placeholder="avatarURL"
          value={form.avatarURL || ''}
          onChange={(e) => setForm({ ...form, avatarURL: e.target.value })}
          className="rounded-lg bg-black/30 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-red-400 sm:col-span-2"
        />
        <button
          onClick={handleCreate}
          className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110 sm:col-span-2"
        >
          Crear usuario
        </button>
      </div>
      {error && <p className="mb-3 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {loading && <p className="text-sm text-slate-300">Cargando...</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-2">Usuario</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Canal</th>
              <th className="px-3 py-2">Creado</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((u) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="px-3 py-2 font-semibold">{u.username || '—'}</td>
                <td className="px-3 py-2 text-slate-300">{u.email}</td>
                <td className="px-3 py-2 text-slate-300">{u.channelName || '—'}</td>
                <td className="px-3 py-2 text-slate-400">{formatDate(u.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="rounded-lg px-3 py-1 text-xs text-red-300 hover:bg-red-500/10"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && <Paginator page={page} totalPages={data.totalPages} onChange={setPage} />}
    </SectionCard>
  );
}
