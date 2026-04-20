'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppUser, Topic, Materials, Material, Quiz } from '@/lib/types';
import { fileType } from '@/lib/utils';
import AdminLayout      from '@/components/admin/AdminLayout';
import AdminDashboard   from '@/components/admin/AdminDashboard';
import Topics           from '@/components/admin/Topics';
import EditTopic        from '@/components/admin/EditTopic';
import Videos           from '@/components/admin/Videos';
import ExamManager      from '@/components/admin/ExamManager';
import AdminLeaderboard from '@/components/admin/Leaderboard';
import AdminProfile     from '@/components/admin/AdminProfile';

type Page = 'dashboard' | 'topics' | 'videos' | 'imtihonlar' | 'leaderboard' | 'profile';

async function uploadFiles(files: FileList, topicId: string): Promise<Material[]> {
  const results: Material[] = [];
  for (const file of Array.from(files)) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('topicId', topicId);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (res.ok) {
      const { url, storagePath } = await res.json();
      results.push({ name: file.name, type: fileType(file.name), url, storagePath });
    }
  }
  return results;
}

export default function AdminPage() {
  const router = useRouter();
  const [user,      setUser]      = useState<AppUser | null>(null);
  const [topics,    setTopics]    = useState<Topic[]>([]);
  const [materials, setMaterials] = useState<Materials>({});
  const [page,      setPage]      = useState<Page>('dashboard');
  const [editTopic, setEditTopic] = useState<Topic | null>(null);
  const [saving,    setSaving]    = useState(false);

  // ── Load ──────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data, error } = await supabase
      .from('topics').select('*').order('sort_order', { ascending: true });
    if (!error && data?.length) {
      const ts: Topic[] = data.map(r => ({
        id: r.id, title: r.title, icon: r.icon || '📚',
        theory: r.theory || '', quizzes: r.quizzes || [], videos: r.videos || [],
      }));
      const mats: Materials = {};
      data.forEach(r => { mats[r.id] = r.materials || []; });
      setTopics(ts);
      setMaterials(mats);
      localStorage.setItem('mq_admin_v2', JSON.stringify({ topics: ts, materials: mats }));
      return;
    }
    const cached = localStorage.getItem('mq_admin_v2');
    if (cached) {
      const p = JSON.parse(cached);
      setTopics(p.topics || []);
      setMaterials(p.materials || {});
    }
  }, []);

  // ── Save ──────────────────────────────────────────────────────
  async function saveData(newTopics: Topic[], newMaterials: Materials) {
    setSaving(true);
    try {
      for (let i = 0; i < newTopics.length; i++) {
        const t = newTopics[i];
        await supabase.from('topics').upsert({
          id: t.id, title: t.title, icon: t.icon, theory: t.theory,
          quizzes: t.quizzes, videos: t.videos,
          materials: newMaterials[t.id] || [],
          sort_order: i, updated_at: new Date().toISOString(),
        });
      }
      localStorage.setItem('mq_admin_v2', JSON.stringify({ topics: newTopics, materials: newMaterials }));
    } finally {
      setSaving(false);
    }
  }

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/'); return; }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).single();
      if (profile?.role !== 'admin') { router.replace('/'); return; }
      setUser({ uid: session.user.id, email: session.user.email!, role: 'admin', name: profile.name || 'Admin' });
      await loadData();
    });
  }, [router, loadData]);

  if (!user) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: '1rem', background: 'var(--bg-main)',
      }}>
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-muted" style={{ fontWeight: 600 }}>Yuklanmoqda...</p>
      </div>
    );
  }

  // ── Topic CRUD ────────────────────────────────────────────────
  async function handleAddTopic(title: string, files: FileList | null) {
    const slug = title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20);
    const id   = `${slug}_${Date.now().toString(36)}`;
    const newTopic: Topic = { id, title, icon: '📚', theory: '', quizzes: [], videos: [] };
    const uploaded = files?.length ? await uploadFiles(files, id) : [];
    const newTopics   = [...topics, newTopic];
    const newMaterials = { ...materials, [id]: uploaded };
    setTopics(newTopics);
    setMaterials(newMaterials);
    await saveData(newTopics, newMaterials);
  }

  async function handleRemoveTopic(topicId: string) {
    for (const m of (materials[topicId] || [])) {
      if (m.storagePath) {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storagePath: m.storagePath }),
        });
      }
    }
    const newTopics   = topics.filter(t => t.id !== topicId);
    const newMaterials = { ...materials };
    delete newMaterials[topicId];
    setTopics(newTopics);
    setMaterials(newMaterials);
    await saveData(newTopics, newMaterials);
    await supabase.from('topics').delete().eq('id', topicId);
  }

  async function handleSaveTopicEdit(id: string, patch: Partial<Topic>, files: FileList | null) {
    const uploaded = files?.length ? await uploadFiles(files, id) : [];
    const newTopics   = topics.map(t => t.id === id ? { ...t, ...patch } : t);
    const newMaterials = { ...materials, [id]: [...(materials[id] || []), ...uploaded] };
    setTopics(newTopics);
    setMaterials(newMaterials);
    await saveData(newTopics, newMaterials);
    setEditTopic(newTopics.find(t => t.id === id) || null);
  }

  async function handleRemoveMaterial(topicId: string, index: number) {
    const mat = (materials[topicId] || [])[index];
    if (mat?.storagePath) {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: mat.storagePath }),
      });
    }
    const newMaterials = {
      ...materials,
      [topicId]: (materials[topicId] || []).filter((_, i) => i !== index),
    };
    setMaterials(newMaterials);
    await saveData(topics, newMaterials);
  }

  // ── Video CRUD ────────────────────────────────────────────────
  async function handleAddVideo(topicId: string, title: string, url: string, xp: number) {
    const newTopics = topics.map(t =>
      t.id === topicId ? { ...t, videos: [...(t.videos || []), { title, url, xp }] } : t
    );
    setTopics(newTopics);
    await saveData(newTopics, materials);
  }

  async function handleRemoveVideo(topicId: string, index: number) {
    const newTopics = topics.map(t =>
      t.id === topicId ? { ...t, videos: (t.videos || []).filter((_, i) => i !== index) } : t
    );
    setTopics(newTopics);
    await saveData(newTopics, materials);
  }

  // ── Quiz CRUD ─────────────────────────────────────────────────
  async function handleAddQuestion(topicId: string, quiz: Quiz) {
    const newTopics = topics.map(t =>
      t.id === topicId ? { ...t, quizzes: [...(t.quizzes || []), quiz] } : t
    );
    setTopics(newTopics);
    await saveData(newTopics, materials);
  }

  async function handleRemoveQuestion(topicId: string, index: number) {
    const newTopics = topics.map(t =>
      t.id === topicId ? { ...t, quizzes: (t.quizzes || []).filter((_, i) => i !== index) } : t
    );
    setTopics(newTopics);
    await saveData(newTopics, materials);
  }

  // ── Render ────────────────────────────────────────────────────
  function renderPage() {
    if (editTopic) {
      return (
        <EditTopic
          topic={editTopic} materials={materials} saving={saving}
          onSave={handleSaveTopicEdit}
          onRemoveMaterial={handleRemoveMaterial}
          onAddQuestion={handleAddQuestion}
          onRemoveQuestion={handleRemoveQuestion}
          onBack={() => setEditTopic(null)}
        />
      );
    }
    switch (page) {
      case 'dashboard':
        return <AdminDashboard topics={topics} materials={materials} onNavigate={p => setPage(p as Page)} />;
      case 'topics':
        return (
          <Topics topics={topics} materials={materials} saving={saving}
            onAdd={handleAddTopic} onRemove={handleRemoveTopic} onEdit={t => setEditTopic(t)} />
        );
      case 'videos':
        return (
          <Videos topics={topics} saving={saving}
            onAddVideo={handleAddVideo} onRemoveVideo={handleRemoveVideo} />
        );
      case 'imtihonlar':
        return <ExamManager topics={topics} />;
      case 'leaderboard':
        return <AdminLeaderboard />;
      case 'profile':
        return <AdminProfile user={user!} topicsCount={topics.length} />;
    }
  }

  return (
    <AdminLayout
      user={user!}
      currentPage={editTopic ? 'topics' : page}
      saving={saving}
      onNavigate={p => { setEditTopic(null); setPage(p as Page); }}
    >
      {renderPage()}
    </AdminLayout>
  );
}
