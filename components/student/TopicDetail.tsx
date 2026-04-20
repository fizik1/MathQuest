'use client';
import { Material } from '@/lib/types';
import { Topic } from '@/lib/types';
import { toEmbedUrl, fileIcon, videoKey } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topic: Topic;
  topicIndex: number;
  materials: Material[];
  progress: number;
  watchedVideos: { [key: string]: boolean };
  onWatchVideo: (videoIndex: number) => Promise<number>;
  onStartQuiz: () => void;
  onBack: () => void;
}

export default function TopicDetail({
  topic, topicIndex, materials, progress, watchedVideos,
  onWatchVideo, onStartQuiz, onBack,
}: Props) {
  const { toast } = useToast();

  async function handleWatch(vi: number) {
    const key = videoKey(topic.id, vi);
    if (watchedVideos[key]) return;
    const xp = await onWatchVideo(vi);
    if (xp > 0) toast(`+${xp} XP to'plandi! 🎉`);
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <button className="back-btn" onClick={onBack}>← Mavzularga</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '2.25rem' }}>{topic.icon}</span>
          <div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0 }}>{topic.title}</h1>
            {progress > 0 && (
              <div className="progress-info" style={{ marginTop: '0.4rem', maxWidth: 220 }}>
                <div className="progress-bar"><div className="fill" style={{ width: `${progress}%` }} /></div>
                <span>{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theory */}
      <section className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="section-title">📖 Nazariya</div>
        {topic.theory ? (
          <div
            className="theory-content"
            dangerouslySetInnerHTML={{ __html: topic.theory }}
          />
        ) : (
          <p className="text-muted" style={{ padding: '1rem 0', textAlign: 'center' }}>
            Nazariya hali qo&apos;shilmagan. O&apos;qituvchingizni kuting.
          </p>
        )}
      </section>

      {/* Materials */}
      {materials.length > 0 && (
        <section className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">📁 O&apos;quv materiallari</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {materials.map((m, i) => (
              <a key={i} href={m.url || '#'} target="_blank" rel="noreferrer"
                className="material-link">
                <span className="file-type-icon">{fileIcon(m.type)}</span>
                <div className="file-meta">
                  <strong>{m.name}</strong>
                  <span>{m.type.toUpperCase()}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Videos */}
      {topic.videos?.length > 0 && (
        <section className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="section-title">🎬 Video darslar</div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {topic.videos.map((v, vi) => {
              const key     = videoKey(topic.id, vi);
              const watched = watchedVideos[key];
              const embed   = toEmbedUrl(v.url);

              return (
                <div key={vi} className="card" style={{ padding: '1rem' }}>
                  {embed ? (
                    <div className="video-embed-wrapper">
                      <iframe
                        src={embed}
                        title={v.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div style={{
                      height: 180, background: 'var(--bg-main)', borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-muted)', fontSize: '0.875rem',
                    }}>
                      Video URL noto&apos;g&apos;ri
                    </div>
                  )}

                  <div className="video-card-footer">
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{v.title}</span>
                    {watched ? (
                      <span className="pill pill-success">✅ Ko&apos;rildi</span>
                    ) : (
                      <button
                        className="primary-btn btn-sm"
                        onClick={() => handleWatch(vi)}
                      >
                        ⚡ +{v.xp || 20} XP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quiz CTA */}
      <section className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧠</div>
        <h2 style={{ marginBottom: '0.4rem', fontSize: '1.3rem' }}>Bilimni sinab ko&apos;ring</h2>
        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {topic.quizzes?.length > 0
            ? `${topic.quizzes.length} ta savol · Har to'g'ri javob uchun 10 XP`
            : 'Savollar hali qo\'shilmagan.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="primary-btn btn-lg"
            onClick={onStartQuiz}
            disabled={!topic.quizzes?.length}
          >
            🚀 Testni boshlash
          </button>
          <button className="secondary-btn btn-lg" onClick={onBack}>
            ← Orqaga
          </button>
        </div>
        {progress >= 70 && (
          <p className="text-success" style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: 700 }}>
            ✅ Bu mavzudan {progress}% ball to&apos;pladingiz!
          </p>
        )}
      </section>
    </div>
  );
}
