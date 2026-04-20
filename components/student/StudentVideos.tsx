'use client';
import { Topic } from '@/lib/types';
import { toEmbedUrl, videoKey } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Props {
  topics: Topic[];
  watchedVideos: { [key: string]: boolean };
  onWatchVideo: (topicId: string, videoIndex: number) => Promise<number>;
}

export default function StudentVideos({ topics, watchedVideos, onWatchVideo }: Props) {
  const { toast } = useToast();
  const topicsWithVideos = topics.filter(t => (t.videos?.length || 0) > 0);

  async function handleWatch(topicId: string, vi: number) {
    const key = videoKey(topicId, vi);
    if (watchedVideos[key]) return;
    const xp = await onWatchVideo(topicId, vi);
    if (xp > 0) toast(`+${xp} XP to'plandi! 🎉`);
  }

  return (
    <div>
      <h1 className="view-title">Videolar 🎬</h1>
      <p className="view-subtitle">Video ko&apos;ring va XP qozing!</p>

      {topicsWithVideos.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">🎬</div>
          <p>Hali video qo&apos;shilmagan.</p>
        </div>
      ) : (
        topicsWithVideos.map(topic => (
          <div key={topic.id} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{topic.icon}</span> {topic.title}
            </h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {(topic.videos || []).map((v, vi) => {
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
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
                      }}>
                        Video URL noto&apos;g&apos;ri
                      </div>
                    )}
                    <div className="video-card-footer">
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1 }}>{v.title}</span>
                      {watched ? (
                        <span className="pill pill-success">✅ Ko&apos;rildi</span>
                      ) : (
                        <button className="primary-btn btn-sm" onClick={() => handleWatch(topic.id, vi)}>
                          ⚡ +{v.xp || 20} XP
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
