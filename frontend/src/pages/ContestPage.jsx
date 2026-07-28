import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Leaderboard from '../components/Leaderboard';

export default function ContestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const [contest, setContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('problems');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [progress, setProgress] = useState({});

  const fetchProgress = useCallback(async () => {
    try {
      const res = await api.get(`/contests/${id}/my-progress`);
      setProgress(res.data);
    } catch {
      // Non-critical
    }
  }, [id]);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await api.get(`/contests/${id}`);
        setContest(res.data);
      } catch (err) {
        setError('Failed to load contest details.');
      } finally {
        setLoading(false);
      }
    };
    fetchContest();
    fetchProgress();
  }, [id, fetchProgress]);

  useEffect(() => {
    window.addEventListener('focus', fetchProgress);
    return () => window.removeEventListener('focus', fetchProgress);
  }, [fetchProgress]);

  useEffect(() => {
    if (!contest) return;

    const updateTimer = () => {
      const now = new Date();
      const start = new Date(contest.startTime);
      const end = new Date(contest.endTime);

      if (now < start) {
        setStatus('Upcoming');
        setTimeRemaining(formatDuration(start - now));
      } else if (now >= start && now <= end) {
        setStatus('Active');
        setTimeRemaining(formatDuration(end - now));
      } else {
        setStatus('Past');
        setTimeRemaining('Contest Ended');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const formatDuration = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const contestAvailable = status === 'Active';

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (error || !contest) return (
    <div className="h-screen bg-background flex items-center justify-center text-red-500 font-bold text-sm px-4 text-center">
      {error || 'Contest not found'}
    </div>
  );

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <nav className="lc-navbar px-3 sm:px-4 md:px-6 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 min-w-0">
            <button onClick={() => navigate('/student')} className="text-muted hover:text-foreground text-xs sm:text-sm shrink-0">← Back</button>
            <h1 className="text-sm sm:text-base md:text-xl font-bold text-foreground truncate">{contest.title}</h1>
          </div>
          <div className="text-right hidden sm:block shrink-0">
            <p className="text-xs font-bold text-foreground">{user.name}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Contest Header */}
        <div className="lc-card p-4 sm:p-6 mb-4 sm:mb-6 md:mb-8 border border-border bg-surface flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2">{contest.title}</h2>
            <p className="text-xs sm:text-sm text-muted line-clamp-2">{contest.description}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-1.5 sm:mt-2">
              {new Date(contest.startTime).toLocaleString()} — {new Date(contest.endTime).toLocaleString()}
            </p>
          </div>
          <div className="text-center sm:text-right bg-background p-3 sm:p-4 rounded-lg border border-border min-w-[160px] sm:min-w-[200px] w-full sm:w-auto shrink-0">
            <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 ${
              status === 'Active' ? 'text-green-500' : status === 'Upcoming' ? 'text-yellow-500' : 'text-gray-500'
            }`}>
              {status === 'Upcoming' ? 'Starts In' : status === 'Active' ? 'Ends In' : 'Status'}
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-foreground">{timeRemaining}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {['problems', ...(isAdmin ? ['leaderboard'] : [])].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-lg text-[10px] sm:text-xs md:text-sm font-bold capitalize transition-all border ${activeTab === tab
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-surface text-muted border-border hover:bg-background'
              }`}>
              {tab === 'problems' ? '📝 Challenges' : '🏆 Leaderboard'}
            </button>
          ))}
        </div>

        {activeTab === 'problems' && (
          <div>
            {status === 'Upcoming' ? (
              <div className="lc-card p-8 sm:p-12 text-center border border-border bg-surface">
                <span className="text-3xl sm:text-4xl block mb-4">⏳</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Contest hasn't started yet!</h3>
                <p className="text-xs sm:text-sm text-muted">The challenges will be revealed once the countdown reaches zero.</p>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-xl overflow-hidden">
                {status === 'Past' && (
                  <div className="bg-gray-500/10 border-b border-border px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs text-muted flex flex-col gap-1.5 sm:gap-2">
                    <div className="flex items-center gap-2">
                      <span>🔓</span>
                      <span>This contest has ended. You can review the problem statements, but you may not submit new solutions.</span>
                    </div>
                  </div>
                )}

                {contest.problems && contest.problems.length > 0 ? (
                  contest.problems.map((p, i) => {
                    const sub = progress[p.id];
                    const hasSub = !!sub;
                    const allPassed = sub?.passedTestCases;
                    const passedCount = sub?.passedCount ?? 0;
                    const totalCount = sub?.totalCount ?? 0;

                    return (
                      <div
                        key={p.id}
                        className={`border-b border-border last:border-b-0 ${contestAvailable ? 'hover:bg-background/50 cursor-pointer' : 'bg-gray-100'} p-3 sm:p-4 flex items-center justify-between transition-colors ${allPassed ? 'bg-green-500/5' : ''}`}
                        onClick={() => {
                          if (!contestAvailable) return;
                          navigate(`/challenge/${p.id}`);
                        }}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                          <span className="text-muted font-bold w-5 sm:w-6 text-xs sm:text-sm shrink-0">{String.fromCharCode(65 + i)}</span>
                          {allPassed && (
                            <span className="text-green-500 text-xs sm:text-sm shrink-0">✓</span>
                          )}
                          <span className={`text-xs sm:text-sm md:text-base text-foreground font-medium transition-colors truncate ${contestAvailable ? 'hover:text-brand' : 'text-gray-500'}`}>
                            {p.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 ml-2">
                          {hasSub && (
                            <span className={`text-[9px] sm:text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${
                              allPassed
                                ? 'text-green-500 bg-green-500/10 border-green-500/30'
                                : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
                            }`}>
                              {passedCount}/{totalCount}
                            </span>
                          )}
                          <span className={`badge-${p.difficulty.toLowerCase()} text-[9px] sm:text-[10px] sm:text-xs`}>
                            {p.difficulty}
                          </span>
                          <span className="text-[9px] sm:text-[10px] sm:text-xs font-bold text-brand bg-brand/10 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-brand/20">
                            {p.points} Pts
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 sm:p-8 text-center text-muted text-sm">No problems available for this contest.</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard contestId={contest.id} />
        )}
      </div>
    </div>
  );
}
