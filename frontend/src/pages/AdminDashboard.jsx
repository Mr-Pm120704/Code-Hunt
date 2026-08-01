import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../api/client';

import AdminProblemForm from '../components/AdminProblemForm';
import AdminContestForm from '../components/AdminContestForm';
import StudentLogsModal from '../components/StudentLogsModal';
import Leaderboard from '../components/Leaderboard';
import WebcamControl from '../components/WebcamControl';
import Analytics from '../components/Analytics';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('problems');
  const [showForm, setShowForm] = useState(false);
  const [showContestForm, setShowContestForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [editingContest, setEditingContest] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedLeaderboardContest, setSelectedLeaderboardContest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showYearSelect, setShowYearSelect] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null);
  const [lastUsedYear, setLastUsedYear] = useState(null);
  const [problemYearFilter, setProblemYearFilter] = useState('All');
  const [studentYearFilter, setStudentYearFilter] = useState('All');
  const [studentClassFilter, setStudentClassFilter] = useState('All');
  const [leaderboardYear, setLeaderboardYear] = useState('1st Year');
  const [overallLeaderboard, setOverallLeaderboard] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get(`/problems?t=${Date.now()}`),
        api.get(`/admin/students?t=${Date.now()}`),
        api.get(`/contests?t=${Date.now()}`),
      ]);

      if (results[0].status === 'fulfilled') setProblems(results[0].value.data);
      if (results[1].status === 'fulfilled') setStudents(results[1].value.data);
      if (results[2].status === 'fulfilled') setContests(results[2].value.data);

    } catch (e) {
      console.error("Fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchData(); 
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      api.get(`/leaderboard/${encodeURIComponent(leaderboardYear)}?t=${Date.now()}`)
        .then(({ data }) => setOverallLeaderboard(data.leaderboard || []))
        .catch(() => setOverallLeaderboard([]));
    }
  }, [activeTab, leaderboardYear]);

  const deleteProblem = async (id) => {
    if (!window.confirm('Delete this problem? All related submissions and logs will also be deleted.')) return;
    try {
      await api.delete(`/problems/${id}`);
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch { alert('Failed to delete.'); }
  };

  const deleteContest = async (id) => {
    if (!window.confirm('Delete this contest? All related data will be lost.')) return;
    try {
      await api.delete(`/admin/contests/${id}`);
      setContests((prev) => prev.filter((c) => c.id !== id));
    } catch { alert('Failed to delete contest.'); }
  };

  const logout = () => { localStorage.clear(); navigate('/login'); };

  const downloadStudentReport = () => {
    const filtered = students
      .filter((s) => studentYearFilter === 'All' || s.year === studentYearFilter)
      .filter((s) => studentClassFilter === 'All' || s.class === studentClassFilter);

    const data = filtered.map((s) => ({
      'Name': s.name,
      'Email': s.email,
      'Year': s.year || '',
      'Class': s.class || '',
      'Problems Solved': s.solvedCount,
      'Solved Problems': s.solvedProblems.map(p => p.problem.title).join(', ') || 'None',
      'Easy Solved': s.solvedProblems.filter(p => p.problem.difficulty === 'Easy').length,
      'Medium Solved': s.solvedProblems.filter(p => p.problem.difficulty === 'Medium').length,
      'Hard Solved': s.solvedProblems.filter(p => p.problem.difficulty === 'Hard').length,
      'Had Distractions': s.hadDistraction ? 'Yes' : 'No',
      'Total Distractions': s.totalDistractions,
      'Webcam Enabled': s.webcamEnabled ? 'Yes' : 'No',
      'Registered On': new Date(s.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 14 },
      { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students Report');
    XLSX.writeFile(wb, `students-report-${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const DIFF_COLORS = {
    Easy: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e' },
    Medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
    Hard: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  };

  if (loading) return (
    <div className="h-screen bg-background flex items-center justify-center transition-colors duration-300">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl md:text-2xl"></span>
            <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">Code<span className="text-brand">Hunt</span></span>
            <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium bg-brand/10 text-brand border border-brand/20">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-foreground hidden sm:inline">{user.name}</span>
            <button id="admin-logout" onClick={logout}
              className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-sm transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted">Manage problems and monitor student activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {[
            { label: 'Problems', value: problems.length, icon: '📝' },
            { label: 'Students', value: students.length, icon: '👥' },
            { label: 'Solved', value: students.reduce((a, s) => a + (s.solvedCount || 0), 0), icon: '✅' },
            { label: 'Distractions', value: students.filter(s => s.hadDistraction).length, icon: '⚠️' },
          ].map((s) => (
            <div key={s.label} className="lc-card p-3 sm:p-4 md:p-5 flex items-center gap-2 sm:gap-3 md:gap-4 bg-surface border-border">
              <span className="text-xl sm:text-2xl md:text-3xl">{s.icon}</span>
              <div>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs - scrollable on mobile */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {['problems', 'contests', 'students', 'webcam', 'leaderboard', 'analytics'].map((tab) => (
            <button key={tab} id={`tab-${tab}`} onClick={() => setActiveTab(tab)}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs md:text-sm font-medium capitalize transition-all border whitespace-nowrap shrink-0 ${activeTab === tab
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-surface text-muted border-border hover:bg-background'
              }`}>
              {tab === 'problems' ? '📝 Problems' : tab === 'contests' ? '🏆 Contests' : tab === 'students' ? '👥 Students' : tab === 'webcam' ? '📷 Webcam' : '🏅 Leaderboard'}
            </button>
          ))}
        </div>

        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Coding Problems</h2>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <select
                  value={problemYearFilter}
                  onChange={(e) => setProblemYearFilter(e.target.value)}
                  className="lc-input bg-input border-border text-foreground text-xs sm:text-sm !py-1.5 sm:!py-2 flex-1 sm:flex-none sm:w-36 md:w-40"
                >
                  <option value="All">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                </select>
                <button id="add-problem-btn" onClick={() => {
                  setEditingProblem(null);
                  if (lastUsedYear) {
                    setSelectedYear(lastUsedYear);
                    setShowForm(true);
                  } else {
                    setShowYearSelect(true);
                  }
                }}
                  className="lc-btn-primary px-3 sm:px-4 text-xs sm:text-sm !py-1.5 sm:!py-2 whitespace-nowrap shrink-0">
                  + Add
                </button>
              </div>
            </div>

            <div className="bg-surface border-border border rounded-xl overflow-hidden">
              {problems
                .filter((p) => problemYearFilter === 'All' || (p.year || '1st Year') === problemYearFilter)
                .map((p) => (
                <div key={p.id} className="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-background/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-foreground font-bold mb-1 truncate">{p.title}</p>
                    <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
                      <span className={`badge-${p.difficulty.toLowerCase()} text-[9px] sm:text-[10px] sm:text-xs`}>{p.difficulty}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{p.category || 'All'}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">{p.year || '1st Year'}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:gap-4 shrink-0">
                    <button onClick={() => { setEditingProblem(p); setShowForm(true); }} className="text-muted hover:text-foreground text-xs sm:text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => deleteProblem(p.id)} className="text-red-500 hover:text-red-400 text-xs sm:text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
              ))}
              {problems.filter((p) => problemYearFilter === 'All' || (p.year || '1st Year') === problemYearFilter).length === 0 && (
                <div className="p-6 sm:p-8 text-center text-muted text-sm">
                  {problemYearFilter === 'All' ? 'No problems created yet.' : `No problems for ${problemYearFilter}.`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contests Tab */}
        {activeTab === 'contests' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Contests</h2>
              <button id="add-contest-btn" onClick={() => { setEditingContest(null); setShowContestForm(true); }}
                className="lc-btn-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm !py-1.5 sm:!py-2">
                + Add
              </button>
            </div>

            <div className="bg-surface border-border border rounded-xl overflow-hidden">
              {contests.map((c) => (
                <div key={c.id} className="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-background/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base text-foreground font-bold mb-1 truncate">{c.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted mb-1 sm:mb-2">
                      {new Date(c.startTime).toLocaleString()} - {new Date(c.endTime).toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-muted mb-1 sm:mb-2 line-clamp-2">{c.description || 'No description available.'}</p>
                    <p className="text-[10px] sm:text-xs text-brand font-medium">
                      {c._count?.problems || 0} Problems
                    </p>
                  </div>
                  <div className="flex gap-3 sm:gap-4 shrink-0">
                    <button onClick={() => { setEditingContest(c); setShowContestForm(true); }} className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => deleteContest(c.id)} className="text-red-500 hover:text-red-400 text-xs sm:text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
              ))}
              {contests.length === 0 && (
                <div className="p-6 sm:p-8 text-center text-muted text-sm">No contests created yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Registered Students</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={studentYearFilter}
                  onChange={(e) => setStudentYearFilter(e.target.value)}
                  className="lc-input bg-input border-border text-foreground text-xs sm:text-sm !py-1.5 sm:!py-2 flex-1 sm:flex-none sm:w-32"
                >
                  <option value="All">All Years</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                </select>
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="lc-input bg-input border-border text-foreground text-xs sm:text-sm !py-1.5 sm:!py-2 flex-1 sm:flex-none sm:w-36"
                >
                  <option value="All">All Classes</option>
                  <option value="B.SC AIML">B.SC AIML</option>
                  <option value="BCA">BCA</option>
                  <option value="B.SC CS">B.SC CS</option>
                </select>
                <button
                  onClick={downloadStudentReport}
                  className="bg-brand text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 sm:py-2 rounded hover:bg-brand-light transition-colors whitespace-nowrap"
                >
                  ⬇ Excel
                </button>
              </div>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {students
                .filter((s) => studentYearFilter === 'All' || s.year === studentYearFilter)
                .filter((s) => studentClassFilter === 'All' || s.class === studentClassFilter)
                .map((s) => (
                <div key={s.id} className="lc-card p-3 sm:p-4 md:p-5 border-border bg-surface">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <p className="text-sm sm:text-base text-foreground font-bold">{s.name}</p>
                        <span className={`text-[9px] sm:text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${s.hadDistraction ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-500'}`}>
                          {s.hadDistraction ? `⚠️ ${s.totalDistractions}` : '✅ Clean'}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted mb-1 truncate">{s.email}</p>
                      <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                        {s.year && (
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">{s.year}</span>
                        )}
                        {s.class && (
                          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{s.class}</span>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] sm:text-xs text-muted font-bold uppercase tracking-wider mb-1.5 sm:mb-2">
                          Solved {s.solvedCount} problem{s.solvedCount !== 1 ? 's' : ''}
                        </p>
                        {s.solvedCount > 0 ? (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {s.solvedProblems.map(sub => (
                              <span
                                key={sub.id}
                                style={{ background: DIFF_COLORS[sub.problem.difficulty]?.bg, color: DIFF_COLORS[sub.problem.difficulty]?.color }}
                                className="text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full font-medium border border-current/20"
                              >
                                {sub.problem.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] sm:text-xs text-muted italic">No problems solved yet.</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="bg-background border border-border text-foreground text-[10px] sm:text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 rounded hover:border-brand transition-colors font-medium shrink-0"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
              {students
                .filter((s) => studentYearFilter === 'All' || s.year === studentYearFilter)
                .filter((s) => studentClassFilter === 'All' || s.class === studentClassFilter)
                .length === 0 && (
                <div className="p-6 sm:p-8 text-center text-muted lc-card bg-surface border-border text-sm">
                  {students.length === 0 ? 'No students registered yet.' : 'No students match the selected filters.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Webcam Control Tab */}
        {activeTab === 'webcam' && (
          <WebcamControl />
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            {/* Overall Year-wise Leaderboard */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">Overall Leaderboard</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={leaderboardYear}
                    onChange={(e) => setLeaderboardYear(e.target.value)}
                    className="lc-input bg-input border-border text-foreground text-xs sm:text-sm !py-1.5 sm:!py-2 w-40"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>
              </div>

              {overallLeaderboard.length === 0 ? (
                <div className="p-6 sm:p-8 text-center text-muted lc-card bg-surface border-border text-sm">No students found for {leaderboardYear}.</div>
              ) : (
                <div className="bg-surface border border-border rounded-xl overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden sm:grid grid-cols-[60px_60px_1fr_100px_100px_100px_80px] gap-2 px-4 py-3 bg-background border-b border-border text-xs font-bold text-muted uppercase tracking-wider">
                    <div>Rank</div>
                    <div>Medal</div>
                    <div>Student</div>
                    <div className="text-center">Solved</div>
                    <div className="text-center">Marks</div>
                    <div className="text-center">XP</div>
                    <div className="text-center">Time</div>
                  </div>
                  {overallLeaderboard.map((s) => (
                    <div key={s.id} className="hidden sm:grid grid-cols-[60px_60px_1fr_100px_100px_100px_80px] gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-background/50 transition-colors items-center">
                      <div className="text-sm font-bold text-foreground">#{s.rank}</div>
                      <div className="text-lg">
                        {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : ''}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted truncate">{s.email}</p>
                      </div>
                      <div className="text-center text-sm font-bold text-foreground">{s.totalSolved}</div>
                      <div className="text-center text-sm font-bold text-brand">{s.totalMarks}</div>
                      <div className="text-center text-sm font-medium text-foreground">{s.xp}</div>
                      <div className="text-center text-xs text-muted">{s.formattedTime}</div>
                    </div>
                  ))}
                  {/* Mobile Cards */}
                  <div className="sm:hidden">
                    {overallLeaderboard.map((s) => (
                      <div key={s.id} className="p-3 border-b border-border last:border-b-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-foreground">#{s.rank}</span>
                          <span className="text-base">{s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : ''}</span>
                          <span className="text-sm font-bold text-foreground truncate flex-1">{s.name}</span>
                        </div>
                        <div className="flex gap-3 text-[10px] text-muted">
                          <span>Solved: <span className="font-bold text-foreground">{s.totalSolved}</span></span>
                          <span>Marks: <span className="font-bold text-brand">{s.totalMarks}</span></span>
                          <span>XP: <span className="font-bold text-foreground">{s.xp}</span></span>
                          <span>Time: <span className="font-bold text-foreground">{s.formattedTime}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contest Leaderboards */}
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-foreground mb-4">Contest Leaderboards</h2>
              
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-muted mb-3">Select a contest to view leaderboard:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {contests.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted col-span-full">No contests available.</p>
                ) : (
                  contests.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedLeaderboardContest(c.id)}
                      className={`p-3 sm:p-4 text-left rounded-lg border transition-all ${
                        selectedLeaderboardContest === c.id
                          ? 'border-brand bg-brand/10'
                          : 'border-border bg-surface hover:border-brand/50'
                      }`}
                    >
                      <p className="text-sm sm:text-base font-bold text-foreground">{c.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted mt-1">
                        {new Date(c.startTime).toLocaleString()}
                      </p>
                      <p className="text-[10px] sm:text-xs text-brand font-medium mt-1">
                        {c._count?.problems || 0} Problems
                      </p>
                    </button>
                  ))
                )}
                </div>
              </div>

              {selectedLeaderboardContest && (
                <div>
                  <Leaderboard contestId={selectedLeaderboardContest} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Analytics students={students} problems={problems} />
        )}
      </div>

      {/* Year Selection Modal */}
      {showYearSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="lc-card w-full max-w-md p-6 sm:p-8 animate-fade-in bg-surface border-border">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Select Academic Year</h2>
            <p className="text-xs sm:text-sm text-muted mb-6">Choose which year this problem is for:</p>
            <div className="space-y-2 sm:space-y-3">
              {['1st Year', '2nd Year', '3rd Year'].map((y) => (
                <button
                  key={y}
                  onClick={() => { setSelectedYear(y); setLastUsedYear(y); setShowYearSelect(false); setShowForm(true); }}
                  className="w-full p-3 sm:p-4 text-left rounded-lg border border-border hover:border-brand hover:bg-brand/5 transition-all flex items-center justify-between group"
                >
                  <span className="text-sm sm:text-base font-bold text-foreground group-hover:text-brand">{y}</span>
                  <span className="text-muted group-hover:text-brand">→</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowYearSelect(false); setSelectedYear(null); }}
              className="w-full mt-4 py-2 text-xs sm:text-sm text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Problem Form Modal */}
      {showForm && (
        <AdminProblemForm
          problem={editingProblem}
          year={editingProblem ? undefined : selectedYear}
          onChangeYear={!editingProblem ? () => { setShowForm(false); setShowYearSelect(true); } : undefined}
          onClose={() => { setShowForm(false); setEditingProblem(null); setSelectedYear(null); }}
          onSaved={() => { setShowForm(false); setEditingProblem(null); setSelectedYear(null); fetchData(); }}
        />
      )}

      {/* Contest Form Modal */}
      {showContestForm && (
        <AdminContestForm
          contest={editingContest}
          problems={problems}
          onClose={() => { setShowContestForm(false); setEditingContest(null); }}
          onSaved={() => { setShowContestForm(false); setEditingContest(null); fetchData(); }}
        />
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentLogsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
