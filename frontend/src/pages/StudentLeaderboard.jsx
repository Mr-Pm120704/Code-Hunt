import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function StudentLeaderboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('');
  const [totalMarksPossible, setTotalMarksPossible] = useState(0);
  const [totalProblems, setTotalProblems] = useState(0);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/leaderboard?t=${Date.now()}`);
        setLeaderboard(data.leaderboard || []);
        setMyRank(data.myRank || null);
        setYear(data.year || '');
        setTotalMarksPossible(data.totalMarksPossible || 0);
        setTotalProblems(data.totalProblems || 0);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) return 'bg-brand/10 border-brand/30';
    if (rank === 1) return 'bg-yellow-500/5 border-yellow-500/20';
    if (rank === 2) return 'bg-gray-300/5 border-gray-300/20';
    if (rank === 3) return 'bg-orange-500/5 border-orange-500/20';
    return 'bg-surface border-border';
  };

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center transition-colors duration-300">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <nav className="lc-navbar px-3 sm:px-4 md:px-6 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => navigate('/student')} className="text-muted hover:text-foreground text-xs sm:text-sm">
              ← <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-brand">Code Hunt</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted">{year}</p>
            </div>
            <button
              onClick={() => { localStorage.clear(); navigate('/login'); }}
              className="text-[10px] sm:text-xs text-muted hover:text-red-500 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">🏆 Leaderboard</h1>
          <p className="text-xs sm:text-sm text-muted">{year} — Ranked by problems solved and completion time</p>
        </div>

        {myRank && (
          <div className="lc-card p-3 sm:p-5 mb-4 sm:mb-6 border-2 border-brand bg-brand/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xl sm:text-3xl font-black text-brand">#{myRank.rank}</span>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-bold text-foreground truncate">{myRank.name} (You)</p>
                  <p className="text-[10px] sm:text-xs text-muted">{myRank.levelTitle} • {myRank.xp} XP</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm sm:text-lg font-bold text-foreground">{myRank.totalMarks} / {totalMarksPossible} marks</p>
                <p className="text-[10px] sm:text-xs text-muted">{myRank.totalSolved} / {totalProblems} solved • {myRank.formattedTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden sm:block lc-card border-border bg-surface overflow-hidden">
          <div className="grid grid-cols-[50px_1fr_100px_80px_100px_80px] gap-2 px-4 py-3 bg-background border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
            <div className="text-center">Rank</div>
            <div>Student</div>
            <div className="text-center">Level</div>
            <div className="text-center">Solved</div>
            <div className="text-center">Marks</div>
            <div className="text-center">Time</div>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-10 sm:p-12 text-center text-muted">
              <p className="text-base sm:text-lg mb-2">No students yet</p>
              <p className="text-xs sm:text-sm">Be the first to solve a problem!</p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`grid grid-cols-[50px_1fr_100px_80px_100px_80px] gap-2 px-4 py-3 border-b border-border last:border-b-0 transition-colors items-center ${getRankStyle(entry.rank, entry.isCurrentUser)}`}
              >
                <div className="text-center">
                  <span className={`text-sm font-black ${entry.rank <= 3 ? 'text-lg' : 'text-sm text-muted'}`}>
                    {getMedal(entry.rank)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-brand' : 'text-foreground'}`}>
                    {entry.name} {entry.isCurrentUser && <span className="text-xs font-medium">(You)</span>}
                  </p>
                  <p className="text-[10px] text-muted truncate">{entry.email}</p>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                    {entry.levelTitle}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-foreground">{entry.totalSolved} / {totalProblems}</span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-bold text-brand">{entry.totalMarks} / {totalMarksPossible}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-muted">{entry.formattedTime}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-2">
          {leaderboard.length === 0 ? (
            <div className="lc-card p-8 text-center text-muted">
              <p className="text-base mb-2">No students yet</p>
              <p className="text-xs">Be the first to solve a problem!</p>
            </div>
          ) : (
            leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`lc-card p-3 border transition-colors ${getRankStyle(entry.rank, entry.isCurrentUser)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-brand w-8 text-center">{getMedal(entry.rank)}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'text-brand' : 'text-foreground'}`}>
                        {entry.name} {entry.isCurrentUser && '(You)'}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">
                        {entry.levelTitle}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand">{entry.totalMarks} / {totalMarksPossible} marks</p>
                    <p className="text-[9px] text-muted">{entry.totalSolved} / {totalProblems} solved • {entry.formattedTime}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
