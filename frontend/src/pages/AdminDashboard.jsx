import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

import AdminProblemForm from '../components/AdminProblemForm';
import AdminContestForm from '../components/AdminContestForm';
import StudentLogsModal from '../components/StudentLogsModal';
import Leaderboard from '../components/Leaderboard';
import WebcamControl from '../components/WebcamControl';

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Use individual try-catches or allSettled to be more resilient
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl"></span>
            <span className="text-xl font-bold text-foreground">Code<span className="text-brand">Hunt</span></span>
            <span className="ml-2 text-xs px-2.5 py-1 rounded-full font-medium bg-brand/10 text-brand border border-brand/20">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">

            <span className="text-sm text-foreground">{user.name}</span>
            <button id="admin-logout" onClick={logout}
              className="px-4 py-2 rounded-lg text-sm transition-all bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">Admin Dashboard</h1>
          <p className="text-muted">Manage problems and monitor student activity.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Problems', value: problems.length, icon: '📝' },
            { label: 'Students', value: students.length, icon: '👥' },
            { label: 'Total Solved', value: students.reduce((a, s) => a + (s.solvedCount || 0), 0), icon: '✅' },
            { label: 'Had Distractions', value: students.filter(s => s.hadDistraction).length, icon: '⚠️' },
          ].map((s) => (
            <div key={s.label} className="lc-card p-5 flex items-center gap-4 bg-surface border-border">
              <span className="text-3xl">{s.icon}</span>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['problems', 'contests', 'students', 'webcam', 'leaderboard'].map((tab) => (
            <button key={tab} id={`tab-${tab}`} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${activeTab === tab
                ? 'bg-brand/10 text-brand border-brand/30'
                : 'bg-surface text-muted border-border hover:bg-background'
              }`}>
              {tab === 'problems' ? '📝 Problems' : tab === 'contests' ? '🏆 Contests' : tab === 'students' ? '👥 Students' : tab === 'webcam' ? '📷 Webcam Control' : '🏅 Leaderboard'}
            </button>
          ))}
        </div>

        {/* Problems Tab */}
        {activeTab === 'problems' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">Coding Problems</h2>
              <div className="flex items-center gap-3">
                <select
                  value={problemYearFilter}
                  onChange={(e) => setProblemYearFilter(e.target.value)}
                  className="lc-input bg-input border-border text-foreground text-sm !py-2 w-40"
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
                  className="lc-btn-primary px-4 text-sm !py-2 h-10 whitespace-nowrap">
                  + Add Problem
                </button>
              </div>
            </div>

            <div className="bg-surface border-border border rounded-xl overflow-hidden">
              {problems
                .filter((p) => problemYearFilter === 'All' || (p.year || '1st Year') === problemYearFilter)
                .map((p) => (
                <div key={p.id} className="p-4 border-b border-border flex items-center justify-between hover:bg-background/50 transition-colors">
                  <div>
                    <p className="text-foreground font-bold mb-1">{p.title}</p>
                    <div className="flex gap-2 items-center">
                      <span className={`badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">{p.category || 'All'}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">{p.year || '1st Year'}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingProblem(p); setShowForm(true); }} className="text-muted hover:text-foreground text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => deleteProblem(p.id)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
              ))}
              {problems.filter((p) => problemYearFilter === 'All' || (p.year || '1st Year') === problemYearFilter).length === 0 && (
                <div className="p-8 text-center text-muted">
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
              <h2 className="text-lg font-semibold text-foreground">Contests</h2>
              <button id="add-contest-btn" onClick={() => { setEditingContest(null); setShowContestForm(true); }}
                className="lc-btn-primary px-4 py-2 text-sm !py-2">
                + Add Contest
              </button>
            </div>

            <div className="bg-surface border-border border rounded-xl overflow-hidden">
              {contests.map((c) => (
                <div key={c.id} className="p-4 border-b border-border flex items-center justify-between hover:bg-background/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-foreground font-bold mb-1">{c.title}</p>
                    <p className="text-xs text-muted mb-2">
                      {new Date(c.startTime).toLocaleString()} - {new Date(c.endTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted mb-2 line-clamp-2">{c.description || 'No description available.'}</p>
                    <p className="text-xs text-brand font-medium">
                      {c._count?.problems || 0} Problems
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => { setEditingContest(c); setShowContestForm(true); }} className="text-blue-500 hover:text-blue-400 text-sm font-medium transition-colors">Edit</button>
                    <button onClick={() => deleteContest(c.id)} className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors">Delete</button>
                  </div>
                </div>
              ))}
              {contests.length === 0 && (
                <div className="p-8 text-center text-muted">No contests created yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Registered Students</h2>
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="lc-card p-5 border-border bg-surface">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="text-foreground font-bold">{s.name}</p>
                        {/* Distraction Badge */}
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.hadDistraction ? 'bg-red-500/15 text-red-500' : 'bg-green-500/15 text-green-500'}`}>
                          {s.hadDistraction ? `⚠️ ${s.totalDistractions} distraction${s.totalDistractions !== 1 ? 's' : ''}` : '✅ Clean'}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-3">{s.email}</p>

                      {/* Solved Problems */}
                      <div>
                        <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2">
                          Solved {s.solvedCount} problem{s.solvedCount !== 1 ? 's' : ''}
                        </p>
                        {s.solvedCount > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {s.solvedProblems.map(sub => (
                              <span
                                key={sub.id}
                                style={{ background: DIFF_COLORS[sub.problem.difficulty]?.bg, color: DIFF_COLORS[sub.problem.difficulty]?.color }}
                                className="text-xs px-2.5 py-1 rounded-full font-medium border border-current/20"
                              >
                                {sub.problem.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted italic">No problems solved yet.</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(s)}
                      className="bg-background border border-border text-foreground text-sm px-4 py-2 rounded hover:border-brand transition-colors font-medium shrink-0"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
              {students.length === 0 && (
                <div className="p-8 text-center text-muted lc-card bg-surface border-border">No students registered yet.</div>
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
            <h2 className="text-lg font-semibold text-foreground mb-4">Contest Leaderboards</h2>
            
            <div className="mb-6">
              <p className="text-sm text-muted mb-3">Select a contest to view leaderboard:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {contests.length === 0 ? (
                  <p className="text-sm text-muted col-span-full">No contests available.</p>
                ) : (
                  contests.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedLeaderboardContest(c.id)}
                      className={`p-4 text-left rounded-lg border transition-all ${
                        selectedLeaderboardContest === c.id
                          ? 'border-brand bg-brand/10'
                          : 'border-border bg-surface hover:border-brand/50'
                      }`}
                    >
                      <p className="font-bold text-foreground">{c.title}</p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(c.startTime).toLocaleString()}
                      </p>
                      <p className="text-xs text-brand font-medium mt-1">
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
        )}
      </div>

      {/* Year Selection Modal */}
      {showYearSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="lc-card w-full max-w-md p-8 animate-fade-in bg-surface border-border">
            <h2 className="text-2xl font-bold text-foreground mb-2">Select Academic Year</h2>
            <p className="text-sm text-muted mb-6">Choose which year this problem is for:</p>
            <div className="space-y-3">
              {['1st Year', '2nd Year', '3rd Year'].map((y) => (
                <button
                  key={y}
                  onClick={() => { setSelectedYear(y); setLastUsedYear(y); setShowYearSelect(false); setShowForm(true); }}
                  className="w-full p-4 text-left rounded-lg border border-border hover:border-brand hover:bg-brand/5 transition-all flex items-center justify-between group"
                >
                  <span className="font-bold text-foreground group-hover:text-brand">{y}</span>
                  <span className="text-muted group-hover:text-brand">→</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowYearSelect(false); setSelectedYear(null); }}
              className="w-full mt-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
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
