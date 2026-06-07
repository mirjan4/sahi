import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { jsPDF } from 'jspdf';
import { motion, LayoutGroup } from 'framer-motion';
import { Trophy, RefreshCw, Star, Medal, Award, Download, FileText, Calendar } from 'lucide-react';

const Scoreboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalEvents, setTotalEvents] = useState(135);
  const [publishedEvents, setPublishedEvents] = useState(0);
  const [finalStatusEnabled, setFinalStatusEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollingActive, setPollingActive] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchScores = async () => {
    try {
      const res = await api.get('/units/leaderboard');
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
        setTotalEvents(res.data.totalEvents || 135);
        setPublishedEvents(res.data.publishedEvents || 0);
        setFinalStatusEnabled(res.data.finalStatusEnabled || false);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch latest scoreboard rankings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();

    // Auto-polling scoreboard every 30 seconds
    const interval = setInterval(() => {
      if (pollingActive) {
        fetchScores();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [pollingActive]);

  const handleManualRefresh = () => {
    setLoading(true);
    fetchScores();
  };

  // Standings Poster Card Exporter
  const generateFinalPoster = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold borders
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Header panel
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(40, 40, canvas.width - 80, 150);
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, canvas.width - 80, 150);

    // Title
    ctx.fillStyle = '#fbbf24';
    ctx.font = "bold 38px 'Outfit', 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText("SAHITHYOLSAV 2026", canvas.width / 2, 98);

    ctx.fillStyle = '#ffffff';
    ctx.font = "18px 'Inter', sans-serif";
    ctx.fillText("OFFICIAL CHAMPIONSHIP STANDINGS", canvas.width / 2, 142);

    // Status badge
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(canvas.width / 2 - 90, 215, 180, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 14px 'Inter', sans-serif";
    ctx.fillText("FINAL STATUS", canvas.width / 2, 238);

    // Champions podium items
    const drawPodiumText = (rank, label, team, points, yPos, color) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, yPos, canvas.width - 120, 80);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(60, yPos, canvas.width - 120, 80);

      ctx.fillStyle = color;
      ctx.font = "bold 24px 'Inter', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(rank, 90, yPos + 48);

      ctx.fillStyle = '#ffffff';
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillText(team ? team.name : '—', 280, yPos + 46);

      ctx.fillStyle = '#818cf8';
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.textAlign = 'right';
      ctx.fillText(`${points} Points`, canvas.width - 90, yPos + 46);
    };

    drawPodiumText("🏆 CHAMPION", "1st Place", leaderboard[0], leaderboard[0]?.points || 0, 280, '#fbbf24');
    drawPodiumText("🥈 RUNNER-UP", "2nd Place", leaderboard[1], leaderboard[1]?.points || 0, 385, '#cbd5e1');
    drawPodiumText("🥉 THIRD PLACE", "3rd Place", leaderboard[2], leaderboard[2]?.points || 0, 490, '#b45309');

    // Standings Ladder
    ctx.fillStyle = '#94a3b8';
    ctx.font = "bold 18px 'Inter', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText("STANDINGS LADDER", 60, 610);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(60, 630, canvas.width - 120, 240);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(60, 630, canvas.width - 120, 240);

    ctx.fillStyle = '#475569';
    ctx.font = "bold 13px 'Inter', sans-serif";
    ctx.fillText("RANK", 80, 660);
    ctx.fillText("TEAM / SECTOR NAME", 160, 660);
    ctx.textAlign = 'right';
    ctx.fillText("POINTS", canvas.width - 80, 660);

    let yIdx = 700;
    leaderboard.forEach((team, idx) => {
      ctx.fillStyle = '#ffffff';
      ctx.font = "14px 'Inter', sans-serif";
      ctx.textAlign = 'left';
      ctx.fillText(`${idx + 1}`, 90, yIdx);
      ctx.fillText(`${team.name} (${team.code})`, 160, yIdx);
      ctx.textAlign = 'right';
      ctx.fillText(`${team.points} pts`, canvas.width - 80, yIdx);
      yIdx += 40;
    });

    // Footer
    ctx.fillStyle = '#64748b';
    ctx.font = "11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText("Generated on " + new Date().toLocaleDateString() + " - Sahithyolsav Result Management Platform", canvas.width / 2, 940);

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sahithyolsav_final_standings_poster.png');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // PDF standins report
  const generatePDFReport = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Sahithyolsav 2026", 40, 55);
    
    doc.setFontSize(15);
    doc.setFont("helvetica", "normal");
    doc.text("Official Championship Standings Report", 40, 80);
    
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 40, 100);
    doc.text(`Total Events Scheduled: ${totalEvents} | Results Published: ${publishedEvents}`, 40, 115);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(40, 130, 555, 130);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Podium Placements:", 40, 155);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`🏆 Champion: ${leaderboard[0] ? `${leaderboard[0].name} (${leaderboard[0].points} Points)` : '—'}`, 60, 180);
    doc.text(`🥈 Runner-Up: ${leaderboard[1] ? `${leaderboard[1].name} (${leaderboard[1].points} Points)` : '—'}`, 60, 200);
    doc.text(`🥉 Third Place: ${leaderboard[2] ? `${leaderboard[2].name} (${leaderboard[2].points} Points)` : '—'}`, 60, 220);

    doc.line(40, 240, 555, 240);

    doc.setFont("helvetica", "bold");
    doc.text("Championship Leaderboard Points Table:", 40, 265);

    doc.setFontSize(10);
    doc.text("Rank", 50, 295);
    doc.text("Sector / Team Name", 110, 295);
    doc.text("Code", 380, 295);
    doc.text("Total Points", 480, 295);
    
    doc.line(40, 305, 555, 305);

    doc.setFont("helvetica", "normal");
    let yPos = 325;
    leaderboard.forEach((team, idx) => {
      doc.text(`${idx + 1}`, 50, yPos);
      doc.text(`${team.name}`, 110, yPos);
      doc.text(`${team.code}`, 380, yPos);
      doc.text(`${team.points} pts`, 480, yPos);
      
      doc.line(40, yPos + 10, 555, yPos + 10);
      yPos += 30;
    });

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is an official document generated by the Sahithyolsav Result Management Platform.", 297, 800, { align: "center" });

    doc.save("sahithyolsav_final_standings_report.pdf");
  };

  return (
    <div className="space-y-8 animate-fade-in relative text-left max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-400 glow-amber" />
            Live Leaderboard Standings
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Championship points board for participating sectors.</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-bold">
            Last update: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={handleManualRefresh}
            className="p-2.5 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading && leaderboard.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : leaderboard.length > 0 ? (
        <div className="space-y-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Published Results</span>
              <span className="text-xl font-extrabold text-white mt-1">
                {publishedEvents} <span className="text-xs text-slate-500">/ {totalEvents} events</span>
              </span>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Remaining Results</span>
              <span className="text-xl font-extrabold text-white mt-1">
                {Math.max(0, totalEvents - publishedEvents)} <span className="text-xs text-slate-500">events left</span>
              </span>
            </div>

            <div className="glass-card rounded-2xl border border-white/5 p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Championship Status</span>
                <span className="text-sm font-extrabold text-white mt-1 block">
                  {finalStatusEnabled ? 'Final Rankings Decided' : 'Competition Ongoing'}
                </span>
              </div>
              <div>
                {finalStatusEnabled ? (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase rounded-lg animate-pulse tracking-wide">
                    FINAL STATUS
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black uppercase rounded-lg animate-pulse tracking-wide">
                    CURRENT STANDINGS
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Final Status Championship Podium Banner */}
          {finalStatusEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-3xl border border-amber-500/20 p-6 md:p-8 bg-gradient-to-r from-amber-950/10 via-slate-900/60 to-amber-950/10 glow-amber flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shadow-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-500 uppercase tracking-widest block mb-0.5">Sahithyolsav 2026</span>
                  <h2 className="text-xl md:text-2xl font-black text-white">Championship Final Results</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Champion: <span className="text-white font-extrabold">{leaderboard[0]?.name} ({leaderboard[0]?.points} pts)</span> | 
                    Runner-Up: <span className="text-white font-bold">{leaderboard[1]?.name} ({leaderboard[1]?.points} pts)</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={generateFinalPoster}
                  className="flex-1 md:flex-none px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 border border-white/5"
                >
                  <Download className="w-4 h-4" /> Standings Poster
                </button>
                <button
                  onClick={generatePDFReport}
                  className="flex-1 md:flex-none px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <FileText className="w-4 h-4" /> Standings Report
                </button>
              </div>
            </motion.div>
          )}

          {/* Standard Top 3 Cards (Show when competition is ongoing) */}
          {!finalStatusEnabled && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="glass-card rounded-2xl border border-white/5 p-6 text-center order-2 md:order-1 h-fit md:h-[220px] bg-gradient-to-b from-slate-900/60 to-slate-950 flex flex-col justify-between"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-slate-300/20 text-slate-300 flex items-center justify-center font-black border border-slate-300/30 mb-3 relative shadow-inner">
                      <Medal className="w-6 h-6" />
                      <span className="absolute -bottom-1 -right-1 bg-slate-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">2</span>
                    </div>
                    <h3 className="font-extrabold text-white text-md">{leaderboard[1].name}</h3>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">{leaderboard[1].code}</span>
                  </div>
                  <div className="text-xl font-black text-indigo-400 mt-4">{leaderboard[1].points} pts</div>
                </motion.div>
              )}

              {/* 1st Place */}
              {leaderboard[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="glass-card rounded-2xl border border-indigo-500/20 p-8 text-center order-1 md:order-2 h-fit md:h-[260px] bg-gradient-to-b from-indigo-950/20 to-slate-950 glow-indigo"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-black border border-amber-500/30 mb-3 relative shadow-md">
                      <Trophy className="w-8 h-8 fill-amber-300/10" />
                      <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">1</span>
                    </div>
                    <h3 className="font-extrabold text-white text-lg">{leaderboard[0].name}</h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">{leaderboard[0].code}</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-4">{leaderboard[0].points} pts</div>
                </motion.div>
              )}

              {/* 3rd Place */}
              {leaderboard[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="glass-card rounded-2xl border border-white/5 p-6 text-center order-3 md:order-3 h-fit md:h-[200px] bg-gradient-to-b from-slate-900/60 to-slate-950 flex flex-col justify-between"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-amber-700/20 text-amber-600 flex items-center justify-center font-black border border-amber-700/30 mb-3 relative shadow-inner">
                      <Medal className="w-6 h-6" />
                      <span className="absolute -bottom-1 -right-1 bg-amber-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">3</span>
                    </div>
                    <h3 className="font-extrabold text-white text-md">{leaderboard[2].name}</h3>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">{leaderboard[2].code}</span>
                  </div>
                  <div className="text-xl font-black text-indigo-400 mt-4">{leaderboard[2].points} pts</div>
                </motion.div>
              )}
            </section>
          )}

          {/* Unified points table for all teams */}
          <section className="space-y-4 pt-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
              {finalStatusEnabled ? 'Final Championship Standings' : 'Points Table Rankings'}
            </h2>
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
              <LayoutGroup>
                <div className="divide-y divide-white/5">
                  {leaderboard.map((unit, index) => (
                    <motion.div
                      layout
                      key={unit._id}
                      className="p-5 flex items-center justify-between hover:bg-slate-900/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-amber-500/20 text-amber-300' :
                          index === 1 ? 'bg-slate-300/20 text-slate-300' :
                          index === 2 ? 'bg-amber-800/20 text-amber-500' :
                          'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <span className="text-sm font-bold text-white flex items-center gap-2">
                            {unit.name}
                            {index === 0 && finalStatusEnabled && <span className="text-xs">🏆</span>}
                          </span>
                          <span className="text-[9px] block font-bold text-slate-500 uppercase tracking-wider">{unit.code}</span>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-indigo-400">{unit.points} pts</span>
                    </motion.div>
                  ))}
                </div>
              </LayoutGroup>
            </div>
          </section>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-sm">No scores registered yet. Scoreboard is currently empty.</p>
        </div>
      )}
    </div>
  );
};

export default Scoreboard;
