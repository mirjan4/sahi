import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { motion } from 'framer-motion';
import { User, Award, ShieldAlert, ArrowLeft, Trophy, Calendar } from 'lucide-react';

const ParticipantProfile = () => {
  const { regNo } = useParams();
  const [participant, setParticipant] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, resultsRes] = await Promise.all([
          api.get(`/participants/reg/${regNo.toUpperCase()}`),
          api.get('/results'), // only published results
        ]);

        if (profileRes.data.success) {
          setParticipant(profileRes.data.participant);
          
          // Filter results where this participant won
          const pId = profileRes.data.participant._id;
          const pResults = resultsRes.data.results.filter((res) =>
            res.winners.some((w) => (w.participant?._id || w.participant) === pId)
          );
          setResults(pResults);
        }
      } catch (err) {
        console.error(err);
        setError('Participant profile not found. Verify registration number.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [regNo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Lookup Failed</h2>
        <p className="text-slate-400 text-sm">{error || 'Could not load profile.'}</p>
        <Link to="/results" className="inline-flex px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto text-left">
      <div className="flex items-center gap-3">
        <Link to="/results" className="p-2 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Participant Profile</h1>
          <p className="text-slate-400 mt-1 font-medium">Contestant registrations, achievements, and stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="glass-card rounded-2xl border border-white/5 p-6 h-fit space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 glow-indigo">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-white leading-tight">{participant.name}</h2>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{participant.registerNo}</span>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold uppercase">Category</span>
              <span className="text-slate-300 font-semibold">{participant.category?.name || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold uppercase">Unit / House</span>
              <span className="text-emerald-400 font-bold">{participant.unit?.name || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Achievements Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-slate-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-amber-400" /> Contest Achievements
              </h3>
            </div>

            {results.length > 0 ? (
              <div className="divide-y divide-white/5">
                {results.map((res) => {
                  const winner = res.winners.find((w) => (w.participant?._id || w.participant) === participant._id);
                  return (
                    <div key={res._id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-indigo-400" />
                          {res.event?.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                          {res.event?.category?.name} | {res.event?.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase inline-block mb-1 ${
                            winner.position === 1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            winner.position === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                            winner.position === 3 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {winner.position > 0 ? `#${winner.position} Place` : 'Grade Point'}
                          </span>
                          <div className="text-[10px] text-indigo-400 font-bold">Awarded: {winner.points} pts</div>
                        </div>

                        {winner.grade && (
                          <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs">
                            Grade {winner.grade}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                No contest placements recorded yet. Keep competing!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantProfile;
