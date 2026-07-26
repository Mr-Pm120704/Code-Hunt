import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';


export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('practice');
  const [stats, setStats] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [probRes, contRes, statsRes] = await Promise.allSettled([
        api.get(`/problems?t=${Date.now()}`),
        api.get(`/contests?t=${Date.now()}`),
        api.get('/submit/stats'),
      ]);
      if (probRes.status === 'fulfilled') setProblems(probRes.value.data);
      if (contRes.status === 'fulfilled') setContests(contRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } catch (e) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, []);

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center transition-colors duration-300">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const categories = ['All', ...new Set(problems.map(p => p.category).filter(c => c && c !== 'All'))];
  const filteredProblems = activeCategory === 'All' 
    ? problems 
    : problems.filter(p => p.category === activeCategory);

  const solvedCount = problems.filter(p => p.isSolved).length;
  const progressPercent = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Navbar */}
      <nav className="lc-navbar px-4 md:px-6 bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-6">
            <h1 className="text-lg md:text-xl font-bold text-brand">Code Hunt</h1>
            <div className="hidden md:flex gap-4 text-sm text-muted">
              <span 
                className={`cursor-pointer font-medium ${viewMode === 'practice' ? 'text-foreground border-b-2 border-brand' : 'hover:text-foreground'}`}
                onClick={() => setViewMode('practice')}
              >
                Practice
              </span>
              <span 
                className={`cursor-pointer font-medium ${viewMode === 'contests' ? 'text-foreground border-b-2 border-brand' : 'hover:text-foreground'}`}
                onClick={() => setViewMode('contests')}
              >
                Contests
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted">{user.email}</p>
              {user.year && (
                <p className="text-[10px] text-brand font-bold">{user.year === '1' ? '1st Year' : user.year === '2' ? '2nd Year' : user.year === '3' ? '3rd Year' : user.year}</p>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs text-muted hover:text-red-500 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="lc-card overflow-hidden border-border bg-surface">
              <div className="px-6 py-4 border-b border-border flex flex-col gap-4 bg-surface">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-foreground">Problem Set</h2>
                  <div className="flex gap-2 text-xs">
                    <span className="px-3 py-1 bg-background border border-border rounded-full text-muted">Difficulty ▾</span>
                    <span className="px-3 py-1 bg-background border border-border rounded-full text-muted">Status ▾</span>
                  </div>
                </div>
                
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                        activeCategory === cat 
                          ? 'bg-brand/10 text-brand border-brand/30' 
                          : 'bg-background text-muted border-border hover:border-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="p-20 text-center">
                  <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : error ? (
                <div className="p-10 text-center text-red-400">{error}</div>
              ) : viewMode === 'practice' ? (
                <div className="bg-surface">
                  {filteredProblems.map((p, i) => (
                    <div 
                      key={p.id} 
                      className="problem-row border-b border-border hover:bg-background/50 cursor-pointer"
                      onClick={() => navigate(`/challenge/${p.id}`)}
                    >
                      <div className="w-6 md:w-8 text-muted text-[10px] md:text-sm">{i + 1}.</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs md:text-sm text-foreground hover:text-brand font-medium transition-colors truncate block">
                          {p.title}
                        </span>
                      </div>
                      <div className="w-16 md:w-24 text-center flex items-center justify-center gap-2">
                        <span className={`badge-${p.difficulty.toLowerCase()} text-[10px] md:text-xs`}>
                          {p.difficulty}
                        </span>
                      </div>
                      <div className="hidden sm:block w-24 text-right">
                        {p.isSolved ? (
                          <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">Solved ✅</span>
                        ) : (
                          <span className="text-xs text-brand hover:underline">Solve →</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredProblems.length === 0 && (
                    <div className="p-8 text-center text-muted">No problems found for {activeCategory}.</div>
                  )}
                </div>
              ) : (
                <div className="bg-surface p-4 space-y-4">
                  {contests.length === 0 ? (
                    <div className="p-8 text-center text-muted">No contests available at the moment.</div>
                  ) : (
                    contests.map((c) => {
                      const now = new Date();
                      const start = new Date(c.startTime);
                      const end = new Date(c.endTime);
                      let status = 'Upcoming';
                      let statusColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
                      
                      if (now >= start && now <= end) {
                        status = 'Active';
                        statusColor = 'text-green-500 bg-green-500/10 border-green-500/20';
                      } else if (now > end) {
                        status = 'Past';
                        statusColor = 'text-gray-500 bg-gray-500/10 border-gray-500/20';
                      }

                      return (
                        <div key={c.id} className="lc-card p-5 border border-border hover:border-brand/50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-foreground hover:text-brand cursor-pointer" onClick={() => navigate(`/contest/${c.id}`)}>
                                {c.title}
                              </h3>
                              <p className="text-xs text-muted mt-1">
                                {start.toLocaleString()} - {end.toLocaleString()}
                              </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {status}
                            </span>
                          </div>
                          <p className="text-sm text-muted mb-4">{c.description || 'No description available.'}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground bg-background px-2 py-1 rounded">
                              {c._count?.problems || 0} Challenges
                            </span>
                            <button 
                              onClick={() => navigate(`/contest/${c.id}`)}
                              className="text-xs bg-brand text-white px-4 py-1.5 rounded font-medium hover:bg-brand/80 transition-colors"
                            >
                              {status === 'Active' ? 'Enter Contest' : status === 'Past' ? 'View Results' : 'View Details'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Level & XP Card */}
            {stats && (
              <div className="lc-card p-6 border-border bg-surface">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">{stats.levelTitle}</h3>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-brand/10 text-brand">{stats.xp} XP</span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Progress to Level {stats.level + 1}</span>
                    <span>{stats.xp - stats.currentLevelXp} / 100</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div className="bg-brand h-full transition-all duration-500" style={{ width: `${((stats.xp - stats.currentLevelXp) / 100) * 100}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-muted">
                  <span>Solved: {stats.totalSolved}</span>
                  <span>Time: {stats.totalCompletionTime < 60 ? `${stats.totalCompletionTime}m` : `${Math.floor(stats.totalCompletionTime / 60)}h ${stats.totalCompletionTime % 60}m`}</span>
                </div>
              </div>
            )}

            {/* Daily Goal Card */}
            {stats && (
              <div className="lc-card p-6 border-border bg-surface">
                <h3 className="font-bold text-foreground mb-3">Today's Goal</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-foreground">{stats.todaySolvedCount} / {stats.dailyGoal}</span>
                  {stats.todaySolvedCount >= stats.dailyGoal && (
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500/10 text-green-500">Done</span>
                  )}
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${stats.todaySolvedCount >= stats.dailyGoal ? 'bg-green-500' : 'bg-brand'}`}
                    style={{ width: `${Math.min((stats.todaySolvedCount / stats.dailyGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                {stats.todaySolvedCount < stats.dailyGoal && (
                  <p className="text-xs text-muted mt-2">Solve {stats.dailyGoal - stats.todaySolvedCount} more to complete today's goal</p>
                )}
              </div>
            )}

            {/* Solved Progress Card */}
            <div className="lc-card p-6 border-border bg-surface">
              <h3 className="font-bold text-foreground mb-4">Problem Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Solved</span>
                  <span className="text-lg font-bold text-foreground">{solvedCount} / {problems.length}</span>
                </div>
                <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                  <div className="bg-brand h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
            </div>

            {/* Leaderboard Link */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="lc-card p-6 border-border bg-gradient-to-br from-brand/10 to-transparent w-full text-left hover:border-brand/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-brand mb-1">Leaderboard</h3>
                  <p className="text-xs text-muted">See your ranking among peers</p>
                </div>
                <span className="text-brand text-xl">→</span>
              </div>
            </button>

            <div className="lc-card p-6 border-border bg-gradient-to-br from-brand/10 to-transparent">
              <h3 className="font-bold text-brand mb-2">AI Monitoring</h3>
              <p className="text-xs text-muted leading-relaxed">
                Stay focused! Our AI monitors your gaze. Copy/Paste actions are strictly prohibited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
