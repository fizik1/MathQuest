'use client';
import { useState } from 'react';
import { Topic, Material, Materials, Quiz } from '@/lib/types';
import { fileIcon } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topic: Topic;
  materials: Materials;
  saving: boolean;
  onSave: (id: string, patch: Partial<Topic>, files: FileList | null) => Promise<void>;
  onRemoveMaterial: (topicId: string, index: number) => Promise<void>;
  onAddQuestion: (topicId: string, quiz: Quiz) => Promise<void>;
  onRemoveQuestion: (topicId: string, index: number) => Promise<void>;
  onBack: () => void;
}

export default function EditTopic({
  topic, materials, saving,
  onSave, onRemoveMaterial,
  onAddQuestion, onRemoveQuestion,
  onBack,
}: Props) {
  const { toast } = useToast();

  // ── Basic info ───────────────────────────────────────────────
  const [title,      setTitle]      = useState(topic.title);
  const [icon,       setIcon]       = useState(topic.icon || '📚');
  const [theory,     setTheory]     = useState(topic.theory || '');
  const [files,      setFiles]      = useState<FileList | null>(null);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  // ── Quiz builder ─────────────────────────────────────────────
  const [qType,       setQType]       = useState<'mcq' | 'fib'>('mcq');
  const [question,    setQuestion]    = useState('');
  const [options,     setOptions]     = useState(['', '', '', '']);
  const [correct,     setCorrect]     = useState<number>(0);
  const [fibAnswer,   setFibAnswer]   = useState('');
  const [difficulty,  setDifficulty]  = useState<'easy' | 'medium' | 'hard'>('medium');
  const [confirmQ,    setConfirmQ]    = useState<number | null>(null);

  const mats: Material[] = materials[topic.id] || [];
  const quizzes           = topic.quizzes || [];

  // ── Handlers ─────────────────────────────────────────────────
  async function handleSave() {
    if (!title.trim()) { toast('Mavzu nomini kiriting!', 'warning'); return; }
    await onSave(topic.id, { title: title.trim(), icon: icon || '📚', theory }, files);
    setFiles(null);
    const inp = document.getElementById('edit-files') as HTMLInputElement;
    if (inp) inp.value = '';
    toast('Mavzu yangilandi! ✅');
  }

  async function handleRemoveMat(i: number) {
    await onRemoveMaterial(topic.id, i);
    setConfirmDel(null);
    toast('Material o\'chirildi', 'info');
  }

  function updateOption(i: number, val: string) {
    setOptions(prev => prev.map((o, idx) => idx === i ? val : o));
  }

  async function handleAddQuestion() {
    if (!question.trim()) { toast('Savol matnini kiriting!', 'warning'); return; }
    if (qType === 'mcq' && options.some(o => !o.trim())) {
      toast('Barcha 4 ta variant to\'ldirilishi kerak!', 'warning'); return;
    }
    if (qType === 'fib' && !fibAnswer.trim()) {
      toast('To\'g\'ri javobni kiriting!', 'warning'); return;
    }
    const quiz: Quiz = qType === 'mcq'
      ? { type: 'mcq', q: question.trim(), options: options.map(o => o.trim()), correct, difficulty }
      : { type: 'fib', q: question.trim(), correct: fibAnswer.trim(), difficulty };
    await onAddQuestion(topic.id, quiz);
    setQuestion(''); setOptions(['', '', '', '']); setCorrect(0); setFibAnswer('');
    toast('Savol qo\'shildi! 🧠');
  }

  async function handleRemoveQ(idx: number) {
    await onRemoveQuestion(topic.id, idx);
    setConfirmQ(null);
    toast('Savol o\'chirildi', 'info');
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.75rem' }}>
        <button className="back-btn" onClick={onBack}>← Mavzular ro&apos;yxatiga</button>
        <h1 className="view-title" style={{ marginTop: '0.5rem' }}>
          {topic.icon} {topic.title} — tahrirlash
        </h1>
      </div>

      {/* ── Basic info ──────────────────────────────────────── */}
      <div className="card admin-form-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>📝 Asosiy ma&apos;lumotlar</h3>

        <div className="form-grid">
          <div className="form-group">
            <label>Mavzu nomi *</label>
            <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Emoji belgisi</label>
            <input type="text" className="form-input" value={icon} onChange={e => setIcon(e.target.value)}
              style={{ maxWidth: 100 }} placeholder="📚" />
          </div>
        </div>

        <div className="form-group">
          <label>Nazariya matni (HTML qo&apos;shish mumkin)</label>
          <textarea className="form-input" rows={8} value={theory}
            onChange={e => setTheory(e.target.value)}
            placeholder="<p>Nazariya matni...</p>"
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 }} />
          <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>
            HTML teglar: &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;h3&gt;
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="secondary-btn" onClick={onBack}>Bekor qilish</button>
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            {saving
              ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</>
              : '✅ Saqlash'}
          </button>
        </div>
      </div>

      {/* ── Materials ───────────────────────────────────────── */}
      <div className="card admin-form-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>📁 O&apos;quv materiallari ({mats.length} ta)</h3>

        {mats.length > 0 && (
          <div className="file-list" style={{ marginBottom: '1.25rem' }}>
            {mats.map((m, i) => (
              <div key={i} className="file-item">
                <div className="file-info">
                  <span style={{ fontSize: '1.25rem' }}>{fileIcon(m.type)}</span>
                  <a href={m.url} target="_blank" rel="noreferrer"
                    style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>
                    {m.name}
                  </a>
                  <span className="pill pill-muted" style={{ fontSize: '0.7rem' }}>{m.type.toUpperCase()}</span>
                </div>
                {confirmDel === i ? (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                    <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                      onClick={() => handleRemoveMat(i)}>✓</button>
                    <button className="btn-icon" onClick={() => setConfirmDel(null)}>✕</button>
                  </div>
                ) : (
                  <button className="btn-icon" style={{ color: 'var(--danger)' }}
                    onClick={() => setConfirmDel(i)}>🗑️</button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="form-group">
          <label>Yangi materiallar qo&apos;shish (PDF/Word/PPT)</label>
          <input id="edit-files" type="file" className="form-input"
            accept=".pdf,.doc,.docx,.ppt,.pptx" multiple
            onChange={e => setFiles(e.target.files)} />
        </div>

        {files?.length ? (
          <button className="primary-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Yuklanmoqda...' : `✅ ${files.length} ta fayl qo'shish`}
          </button>
        ) : null}
      </div>

      {/* ── Quiz builder ────────────────────────────────────── */}
      <div className="card admin-form-card" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '1.25rem' }}>🧠 Test savollari ({quizzes.length} ta)</h3>

        {/* Add question form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>➕ Yangi savol qo&apos;shish</p>

          <div className="form-grid" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Savol turi</label>
              <select className="form-input" value={qType} onChange={e => setQType(e.target.value as 'mcq' | 'fib')}>
                <option value="mcq">Ko&apos;p tanlovli (MCQ)</option>
                <option value="fib">Bo&apos;sh joy to&apos;ldirish (FIB)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Qiyinlik darajasi</label>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                {([['easy', '🟢 Oson'], ['medium', '🟡 O\'rtacha'], ['hard', '🔴 Qiyin']] as const).map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => setDifficulty(val)}
                    style={{
                      flex: 1, padding: '0.4rem 0.2rem', border: '1.5px solid',
                      borderColor: difficulty === val ? 'var(--primary)' : 'var(--border)',
                      background: difficulty === val ? 'var(--primary-light)' : 'transparent',
                      color: difficulty === val ? 'var(--primary)' : 'var(--text-muted)',
                      borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Savol matni *</label>
            <textarea className="form-input" rows={2} placeholder="Savol matni..."
              value={question} onChange={e => setQuestion(e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          {qType === 'mcq' ? (
            <div className="form-grid">
              {options.map((opt, i) => (
                <div key={i} className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input type="radio" name="q-correct" checked={correct === i} onChange={() => setCorrect(i)} />
                    <span>{String.fromCharCode(65 + i)}-variant</span>
                    {correct === i && <span className="pill pill-success" style={{ fontSize: '0.65rem' }}>✅ To&apos;g&apos;ri</span>}
                  </label>
                  <input type="text" className="form-input"
                    placeholder={`${String.fromCharCode(65 + i)}-variant`}
                    value={opt} onChange={e => updateOption(i, e.target.value)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="form-group">
              <label>To&apos;g&apos;ri javob *</label>
              <input type="text" className="form-input"
                placeholder="To'g'ri javob..."
                value={fibAnswer} onChange={e => setFibAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !saving && handleAddQuestion()} />
            </div>
          )}

          <button className="primary-btn" onClick={handleAddQuestion} disabled={saving || !question.trim()}>
            {saving
              ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</>
              : '✅ Savol qo\'shish'}
          </button>
        </div>

        {/* Question list */}
        {quizzes.length > 0 && (
          <div>
            {quizzes.map((q, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '0.8rem 0',
                borderBottom: i < quizzes.length - 1 ? '1px solid var(--border)' : 'none',
                gap: '1rem',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>{i + 1}. {q.q}</p>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="pill pill-primary" style={{ fontSize: '0.68rem' }}>{q.type === 'mcq' ? 'MCQ' : 'FIB'}</span>
                    <span className="pill pill-muted" style={{ fontSize: '0.68rem' }}>
                      {q.type === 'mcq'
                        ? `✅ ${(q.options as string[])?.[q.correct as number]}`
                        : `Javob: ${q.correct}`}
                    </span>
                    <span className={`pill ${q.difficulty === 'easy' ? 'pill-success' : q.difficulty === 'hard' ? '' : 'pill-primary'}`}
                      style={{ fontSize: '0.68rem', ...(q.difficulty === 'hard' ? { background: 'var(--danger-light)', color: 'var(--danger)' } : {}) }}>
                      {q.difficulty === 'easy' ? '🟢' : q.difficulty === 'hard' ? '🔴' : '🟡'} {q.difficulty}
                    </span>
                  </div>
                </div>

                {confirmQ === i ? (
                  <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 600 }}>O&apos;chirilsinmi?</span>
                    <button className="btn-icon" style={{ background: 'var(--danger)', color: 'white', borderColor: 'var(--danger)' }}
                      onClick={() => handleRemoveQ(i)}>✓</button>
                    <button className="btn-icon" onClick={() => setConfirmQ(null)}>✕</button>
                  </div>
                ) : (
                  <button className="btn-icon" style={{ color: 'var(--danger)', flexShrink: 0 }}
                    onClick={() => setConfirmQ(i)}>🗑️</button>
                )}
              </div>
            ))}
          </div>
        )}

        {quizzes.length === 0 && (
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Hali savol qo&apos;shilmagan.</p>
        )}
      </div>
    </div>
  );
}
