import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import {
  Users,
  Award,
  ShieldAlert,
  FileCheck2,
  ListOrdered,
  History,
  TrendingUp
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [latestLogs, setLatestLogs] = useState([]);
  const [topUnits, setTopUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await api.get('/system/stats');
        if (res.data.success) {
          setStats(res.data.stats);
          setLatestLogs(res.data.latestLogs);
          setTopUnits(res.data.topUnits);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  const statCards = [
    { title: 'Total Participants', value: stats?.totalParticipants || 0, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { title: 'Total Events', value: stats?.totalEvents || 0, icon: Award, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { title: 'Total Units / Teams', value: stats?.totalUnits || 0, icon: ListOrdered, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { title: 'Published Results', value: `${stats?.publishedResults || 0} / ${stats?.totalResults || 0}`, icon: FileCheck2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-slate-400 mt-1">Live updates, statistics, and system activities.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                  <h3 className="text-2xl font-extrabold text-white mt-2 font-sans">{card.value}</h3>
                </div>
                <div className={`p-3.5 rounded-xl ${card.bg} ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 gap-8">
        {/* Leaderboard Preview */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              Leaderboard Standings
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topUnits.length > 0 ? (
              topUnits.map((unit, index) => (
                <div key={unit._id} className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      index === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                      index === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-white">{unit.name}</span>
                      <span className="text-[10px] block font-bold text-slate-500 uppercase tracking-wider">{unit.code}</span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-indigo-400">{unit.points} pts</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 py-4 text-center col-span-full">No scores computed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
