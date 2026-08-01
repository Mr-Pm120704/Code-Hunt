import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#22c55e', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7', '#ec4899'];

export default function Analytics({ students, problems }) {
  const totalStudents = students.length;
  const totalProblems = problems.length;
  const totalSolved = students.reduce((a, s) => a + (s.solvedCount || 0), 0);

  // Top 10 students by solved count
  const topStudents = [...students]
    .sort((a, b) => (b.solvedCount || 0) - (a.solvedCount || 0))
    .slice(0, 10)
    .map((s) => ({ name: s.name.length > 12 ? s.name.slice(0, 12) + '…' : s.name, solved: s.solvedCount || 0 }));

  // Difficulty distribution
  const diffCount = { Easy: 0, Medium: 0, Hard: 0 };
  problems.forEach((p) => { if (diffCount[p.difficulty] !== undefined) diffCount[p.difficulty]++; });
  const diffData = Object.entries(diffCount)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Year-wise student count
  const yearCount = { '1st Year': 0, '2nd Year': 0, '3rd Year': 0 };
  students.forEach((s) => { if (yearCount[s.year] !== undefined) yearCount[s.year]++; });
  const yearData = Object.entries(yearCount)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // Class-wise student count
  const classCount = {};
  students.forEach((s) => { const c = s.class || 'Unknown'; classCount[c] = (classCount[c] || 0) + 1; });
  const classData = Object.entries(classCount).map(([name, value]) => ({ name, value }));

  // Distraction stats
  const distracted = students.filter((s) => s.hadDistraction).length;
  const clean = totalStudents - distracted;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-6">Data Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Students', value: totalStudents, icon: '👥', color: 'text-blue-500' },
          { label: 'Total Problems', value: totalProblems, icon: '📝', color: 'text-purple-500' },
          { label: 'Problems Solved', value: totalSolved, icon: '✅', color: 'text-green-500' },
          { label: 'Avg Solved/Student', value: totalStudents ? (totalSolved / totalStudents).toFixed(1) : '0', icon: '📊', color: 'text-orange-500' },
        ].map((s) => (
          <div key={s.label} className="lc-card p-4 border-border bg-surface">
            <span className="text-2xl mb-2 block">{s.icon}</span>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Students Bar Chart */}
        <div className="lc-card p-4 sm:p-6 border-border bg-surface">
          <h3 className="text-sm font-bold text-foreground mb-4">Top 10 Students by Problems Solved</h3>
          {topStudents.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topStudents} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="solved" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Difficulty Distribution Pie Chart */}
        <div className="lc-card p-4 sm:p-6 border-border bg-surface">
          <h3 className="text-sm font-bold text-foreground mb-4">Problem Difficulty Distribution</h3>
          {diffData.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={diffData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {diffData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Year-wise Students Bar Chart */}
        <div className="lc-card p-4 sm:p-6 border-border bg-surface">
          <h3 className="text-sm font-bold text-foreground mb-4">Students by Year</h3>
          {yearData.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Class-wise Students Bar Chart */}
        <div className="lc-card p-4 sm:p-6 border-border bg-surface">
          <h3 className="text-sm font-bold text-foreground mb-4">Students by Class</h3>
          {classData.length === 0 ? (
            <p className="text-xs text-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distraction Overview Pie Chart */}
        <div className="lc-card p-4 sm:p-6 border-border bg-surface lg:col-span-2">
          <h3 className="text-sm font-bold text-foreground mb-4">Student Integrity Overview</h3>
          {totalStudents === 0 ? (
            <p className="text-xs text-muted text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Clean (No Distractions)', value: clean },
                    { name: 'Had Distractions', value: distracted },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
