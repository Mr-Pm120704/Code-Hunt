import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

export default function WebcamControl() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/webcam-users?t=${Date.now()}`);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleWebcam = async (userId, currentState) => {
    if (togglingId) return;
    setTogglingId(userId);
    const nextState = !currentState;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, webcamEnabled: nextState } : u))
    );

    try {
      await api.post(`/admin/webcam-toggle/${userId}`, { webcamEnabled: nextState });
    } catch (err) {
      // Rollback on error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, webcamEnabled: currentState } : u))
      );
      alert('Failed to update webcam setting: ' + (err.response?.data?.error || err.message));
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesYear = !filterYear || u.year === filterYear;
    const matchesClass = !filterClass || u.class === filterClass;
    return matchesSearch && matchesYear && matchesClass;
  });

  const years = ['1st Year', '2nd Year', '3rd Year'];
  const classes = ['B.SC AIML', 'B.SC BCA', 'B.SC CS'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Webcam Control</h2>
          <p className="text-sm text-muted">Toggle webcam monitoring for each student individually.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted font-medium">
            Showing <span className="text-foreground font-bold">{filteredUsers.length}</span> of {users.length}
            {filterYear && <span> | <span className="text-foreground font-bold">{filterYear}</span></span>}
            {filterClass && <span> | <span className="text-foreground font-bold">{filterClass}</span></span>}
          </span>
          <span className="text-border">|</span>
          <span className="font-medium text-green-500">{filteredUsers.filter((u) => u.webcamEnabled).length} ON</span>
          <span className="text-border">|</span>
          <span className="font-medium text-red-500">{filteredUsers.filter((u) => !u.webcamEnabled).length} OFF</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 lc-input bg-input border-border text-foreground focus:border-brand text-sm"
        />
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="lc-input bg-input border-border text-foreground focus:border-brand text-sm w-full sm:w-40"
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="lc-input bg-input border-border text-foreground focus:border-brand text-sm w-full sm:w-48"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Year & Class wise count */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        {years.map((y) => {
          const count = filteredUsers.filter((u) => u.year === y).length;
          return (
            <span key={y} className="px-3 py-1.5 rounded-full bg-surface border border-border text-muted">
              {y}: <span className="font-bold text-foreground">{count}</span>
            </span>
          );
        })}
        <span className="text-border">|</span>
        {classes.map((c) => {
          const count = filteredUsers.filter((u) => u.class === c).length;
          return (
            <span key={c} className="px-3 py-1.5 rounded-full bg-surface border border-border text-muted">
              {c}: <span className="font-bold text-foreground">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_80px_1fr_1fr_120px] gap-2 px-4 py-3 bg-background border-b border-border text-xs font-bold text-muted uppercase tracking-wider">
            <div>S.No</div>
            <div>Year</div>
            <div>Class</div>
            <div>Name</div>
            <div className="text-center">Webcam</div>
          </div>

          {/* Table Rows */}
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted">No students found.</div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-[50px_80px_1fr_1fr_120px] gap-2 px-4 py-3 border-b border-border last:border-b-0 hover:bg-background/50 transition-colors items-center"
              >
                <div className="text-sm text-muted font-medium">{index + 1}</div>
                <div className="text-sm text-foreground font-medium">
                  {user.year || '-'}
                </div>
                <div className="text-sm text-foreground font-medium truncate">{user.class || '-'}</div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-bold truncate">{user.name}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleWebcam(user.id, user.webcamEnabled)}
                    disabled={togglingId === user.id}
                    className={`relative inline-flex items-center h-7 w-14 rounded-full transition-all duration-300 focus:outline-none disabled:opacity-60 ${
                      user.webcamEnabled ? 'bg-green-500' : 'bg-red-500/60'
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                        user.webcamEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
