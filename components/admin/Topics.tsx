'use client';
import { useState } from 'react';
import { Topic, Materials } from '@/lib/types';
import { fileIcon } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topics: Topic[];
  materials: Materials;
  saving: boolean;
  onAdd: (title: string, files: FileList | null) => Promise<void>;
  onRemove: (topicId: string) => Promise<void>;
  onEdit: (topic: Topic) => void;
}

export default function Topics({ topics, materials, saving, onAdd, onRemove, onEdit }: Props) {
  const { toast } = useToast();
  const [title,   setTitle]   = useState('');
  const [files,   setFiles]   = useState<FileList | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm,  setConfirm] = useState<string | null>(null);

  async function handleAdd() {
    if (!title.trim()) { toast('Mavzu nomini kiriting!', 'warning'); return; }
    await onAdd(title.trim(), files);
    setTitle(''); setFiles(null);
    const inp = document.getElementById('topic-files') as HTMLInputElement;
    if (inp) inp.value = '';
    toast('Mavzu muvaffaqiyatli saqlandi! ✅');
  }

  async function handleRemove(id: string) {
    setDeleting(id);
    setConfirm(null);
    await onRemove(id);
    setDeleting(null);
    toast('Mavzu o\'chirildi', 'info');
  }

  return (
    <div>
      <h1 className="view-title">Mavzular 📚</h1>
      <p className="view-subtitle">Yangi mavzu qo&apos;shing yoki mavjudlarini tahrirlang.</p>

      {/* Add form */}
      <div className="card admin-form-card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>➕ Yangi mavzu qo&apos;shish</h3>
        <div className="form-group">
          <label>Mavzu nomi *</label>
          <input type="text" className="form-input"
            placeholder="Mavzu nomini kiriting..."
            value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !saving && handleAdd()} />
        </div>
        <div className="form-group">
          <label>📁 O&apos;quv materiallari (PDF/Word/PPT) — ixtiyoriy</label>
          <input id="topic-files" type="file" className="form-input"
            accept=".pdf,.doc,.docx,.ppt,.pptx" multiple
            onChange={e => setFiles(e.target.files)} />
        </div>
        <button className="primary-btn" onClick={handleAdd} disabled={saving || !title.trim()}>
          {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</> : '✅ Saqlash'}
        </button>
      </div>

      {/* Topic list */}
      {topics.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📚</div>
          <p>Hali mavzu qo&apos;shilmagan.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {topics.map((topic, i) => {
            const mats = materials[topic.id] || [];
            return (
              <div key={topic.id} className="admin-list-item"
                style={{ borderBottom: i < topics.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{topic.icon}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {topic.title}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="pill pill-primary">{topic.quizzes?.length || 0} savol</span>
                    <span className="pill" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--secondary)' }}>
                      {topic.videos?.length || 0} video
                    </span>
                    {mats.length > 0 && (
                      <span className="pill pill-muted">{mats.length} material</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-icon" onClick={() => onEdit(topic)} title="Tahrirlash">✏️</button>

                  {confirm === topic.id ? (
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                      <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                        onClick={() => handleRemove(topic.id)} disabled={deleting === topic.id}>
                        {deleting === topic.id ? <div className="spinner" style={{ width: 12, height: 12 }} /> : '✓'}
                      </button>
                      <button className="btn-icon" onClick={() => setConfirm(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn-icon" style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                      onClick={() => setConfirm(topic.id)} title="O'chirish">🗑️</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
