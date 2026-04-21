'use client';
import { useEffect, useState } from 'react';
import { getLeaderboard } from '@/lib/api';
import { AppUser } from '@/lib/types';

interface Props { user: AppUser; }
interface Row { student_id: string; name: string; xp: number; level: number; }

export default function StudentLeaderboard({ user }: Props) {
  const [rows,    setRows]    = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(data => { setRows(data); setLoading(false); });
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <h1 className="view-title">Reyting 🏆</h1>
      <p className="view-subtitle">Eng yaxshi o&apos;quvchilar ro&apos;yxati.</p>

      <div className="card" style={{ padding: '0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>Hali hech kim yo&apos;q. Birinchi bo&apos;ling!</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr><th>#</th><th>O&apos;quvchi</th><th>XP</th><th>Daraja</th></tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isMe = row.student_id === user.uid;
                return (
                  <tr key={row.student_id} className={isMe ? 'highlight' : ''}>
                    <td style={{ fontWeight: 700, fontSize: i < 3 ? '1.1rem' : '0.95rem' }}>
                      {medals[i] || i + 1}
                    </td>
                    <td>
                      <span style={{ fontWeight: isMe ? 800 : 500 }}>{row.name || "O'quvchi"}</span>
                      {isMe && <span className="pill pill-primary" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>Siz</span>}
                    </td>
                    <td><span className="pill pill-primary">⚡ {row.xp}</span></td>
                    <td><span className="text-muted" style={{ fontSize: '0.88rem' }}>🌟 {row.level}-daraja</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
