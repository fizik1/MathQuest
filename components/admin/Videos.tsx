'use client';
import { useState } from 'react';
import { Topic } from '@/lib/types';
import { toEmbedUrl } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topics: Topic[];
  saving: boolean;
  onAddVideo: (topicId: string, title: string, url: string, xp: number) => Promise<void>;
  onRemoveVideo: (topicId: string, index: number) => Promise<void>;
  onEditVideo: (topicId: string, index: number, title: string, url: string, xp: number) => Promise<void>;
}

type EditState = { topicId: string; index: number; title: string; url: string; xp: number } | null;

export default function Videos({ topics, saving, onAddVideo, onRemoveVideo, onEditVideo }: Props) {
  const { toast } = useToast();
  const [topicId, setTopicId] = useState(topics[0]?.id || '');
  const [title,   setTitle]   = useState('');
  const [url,     setUrl]     = useState('');
  const [xp,      setXp]      = useState(20);
  const [confirm, setConfirm] = useState<{ topicId: string; index: number } | null>(null);
  const [editing, setEditing] = useState<EditState>(null);

  async function handleAdd() {
    if (!topicId || !title.trim() || !url.trim()) {
      toast('Barcha maydonlarni to\'ldiring!', 'warning'); return;
    }
    const embed = toEmbedUrl(url.trim());
    await onAddVideo(topicId, title.trim(), embed, xp);
    setTitle(''); setUrl(''); setXp(20);
    toast('Video qo\'shildi! 🎬');
  }

  async function handleRemove(tId: string, idx: number) {
    await onRemoveVideo(tId, idx);
    setConfirm(null);
    toast('Video o\'chirildi', 'info');
  }

  function startEdit(tId: string, idx: number, v: { title: string; url: string; xp: number }) {
    setEditing({ topicId: tId, index: idx, title: v.title, url: v.url, xp: v.xp });
    setConfirm(null);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.url.trim()) {
      toast('Barcha maydonlarni to\'ldiring!', 'warning'); return;
    }
    const embed = toEmbedUrl(editing.url.trim());
    await onEditVideo(editing.topicId, editing.index, editing.title.trim(), embed, editing.xp);
    setEditing(null);
    toast('Video yangilandi! ✅');
  }

  return (
    <div>
      <h1 className="view-title">Videolar 🎬</h1>
      <p className="view-subtitle">Mavzularga YouTube video qo&apos;shing.</p>

      {/* Edit form (inline, shown on top when editing) */}
      {editing && (
        <div className="card admin-form-card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>✏️ Videoni tahrirlash</h3>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Video nomi</label>
            <input type="text" className="form-input" value={editing.title}
              onChange={e => setEditing(s => s && ({ ...s, title: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>YouTube URL</label>
            <input type="text" className="form-input" value={editing.url}
              onChange={e => setEditing(s => s && ({ ...s, url: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>XP mukofot</label>
            <input type="number" className="form-input" value={editing.xp} min={5} max={200}
              style={{ maxWidth: 120 }}
              onChange={e => setEditing(s => s && ({ ...s, xp: Math.max(5, +e.target.value) }))} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="primary-btn" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</> : '✅ Saqlash'}
            </button>
            <button className="primary-btn" style={{ background: 'var(--border)', color: 'var(--text-main)' }}
              onClick={() => setEditing(null)}>Bekor qilish</button>
          </div>
        </div>
      )}

      {/* Add form */}
      {!editing && (
        <div className="card admin-form-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>➕ Video qo&apos;shish</h3>

          {topics.length === 0 ? (
            <p className="text-muted">Avval mavzu qo&apos;shing.</p>
          ) : (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mavzu</label>
                  <select className="form-input" value={topicId} onChange={e => setTopicId(e.target.value)}>
                    {topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>XP mukofot</label>
                  <input type="number" className="form-input" value={xp} min={5} max={200}
                    onChange={e => setXp(Math.max(5, +e.target.value))} />
                </div>
              </div>
              <div className="form-group">
                <label>Video nomi</label>
                <input type="text" className="form-input" placeholder="Video nomi..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>YouTube URL</label>
                <input type="text" className="form-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !saving && handleAdd()} />
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
                  YouTube watch yoki embed URL qabul qilinadi
                </p>
              </div>
              <button className="primary-btn" onClick={handleAdd} disabled={saving || !title.trim() || !url.trim()}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</> : '✅ Qo\'shish'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Video list per topic */}
      {topics.map(topic => {
        const videos = topic.videos || [];
        if (videos.length === 0) return null;
        return (
          <div key={topic.id} className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{topic.icon} {topic.title}</h3>
            {videos.map((v, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.7rem 0', borderBottom: i < videos.length - 1 ? '1px solid var(--border)' : 'none',
                gap: '1rem',
                background: editing?.topicId === topic.id && editing?.index === i ? 'rgba(var(--primary-rgb),0.06)' : undefined,
                borderRadius: 8, paddingLeft: '0.5rem',
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🎬 {v.title}
                  </p>
                  <span className="pill pill-primary" style={{ marginTop: '0.25rem', fontSize: '0.72rem' }}>⚡ +{v.xp} XP</span>
                </div>

                {confirm?.topicId === topic.id && confirm?.index === i ? (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                    <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                      onClick={() => handleRemove(topic.id, i)}>✓</button>
                    <button className="btn-icon" onClick={() => setConfirm(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                    <button className="btn-icon" title="Tahrirlash"
                      style={{ background: 'rgba(var(--primary-rgb),0.1)' }}
                      onClick={() => startEdit(topic.id, i, v)}>✏️</button>
                    <button className="btn-icon" style={{ color: 'var(--danger)' }}
                      onClick={() => setConfirm({ topicId: topic.id, index: i })}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
