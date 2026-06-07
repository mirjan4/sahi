import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { jsPDF } from 'jspdf';
import { Link } from 'react-router-dom';
import { Award, ArrowLeft, Download, Layers, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

const CertificateGenerator = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [winners, setWinners] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchTemplatesAndEvents = async () => {
      try {
        const [tempRes, eventsRes] = await Promise.all([
          api.get('/certificates/templates'),
          api.get('/events'),
        ]);

        if (tempRes.data.success) {
          setTemplates(tempRes.data.templates);
          const defaultTemp = tempRes.data.templates.find((t) => t.isDefault) || tempRes.data.templates[0];
          setSelectedTemplateId(defaultTemp?._id || '');
        }

        if (eventsRes.data.success) {
          setEvents(eventsRes.data.events);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load certificate generator files.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplatesAndEvents();
  }, []);

  // Fetch results when event is selected
  useEffect(() => {
    if (selectedEventId) {
      const fetchWinners = async () => {
        try {
          const res = await api.get(`/results/event/${selectedEventId}`);
          if (res.data.success) {
            setWinners(res.data.result.winners || []);
            setError('');
          }
        } catch (err) {
          console.error(err);
          setWinners([]);
          setError('No results published for this event yet.');
        }
      };

      fetchWinners();
    } else {
      setWinners([]);
    }
  }, [selectedEventId]);

  // Helper to draw single certificate on canvas
  const drawCertificateOnCanvas = (winner, template) => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas || !template) return reject('Canvas or template missing');

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = template.backgroundImage;

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw background
        ctx.drawImage(img, 0, 0);

        document.fonts.ready.then(() => {
          const drawText = (elementKey, text) => {
            const fontConfig = template.config[elementKey];
            if (!fontConfig || !text) return;

            const x = (fontConfig.x / 100) * canvas.width;
            const y = (fontConfig.y / 100) * canvas.height;
            const size = fontConfig.fontSize;

            ctx.save();
            ctx.fillStyle = fontConfig.color;
            ctx.textAlign = fontConfig.align;
            ctx.textBaseline = 'middle';

            const weight = fontConfig.fontWeight || 'normal';
            ctx.font = `${weight} ${size}px 'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif`;

            ctx.fillText(text, x, y);
            ctx.restore();
          };

          const selectedEvent = events.find((e) => e._id === selectedEventId);

          const participantName = winner.participant?.name || '';
          const eventNameText = selectedEvent?.name || '';
          const categoryNameText = selectedEvent?.category?.name || '';
          
          let posStr = 'Participation';
          if (winner.position === 1) posStr = 'First Place';
          else if (winner.position === 2) posStr = 'Second Place';
          else if (winner.position === 3) posStr = 'Third Place';
          
          const gradeStr = winner.grade ? `Grade ${winner.grade}` : '';

          drawText('participantName', participantName);
          drawText('eventName', eventNameText);
          drawText('categoryName', categoryNameText);
          drawText('positionText', posStr);
          drawText('gradeText', gradeStr);

          resolve();
        });
      };

      img.onerror = (err) => {
        reject(err);
      };
    });
  };

  const handleDownloadSingle = async (winner) => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template) return;

    setGenerating(true);
    setStatus(`Rendering certificate for ${winner.participant?.name}...`);

    try {
      await drawCertificateOnCanvas(winner, template);
      const canvas = canvasRef.current;
      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;

      const orientation = width > height ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'px', [width, height]);
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${winner.participant?.name.replace(/\s+/g, '_')}_certificate.pdf`);
      setStatus('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate certificate.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadBulk = async () => {
    const template = templates.find((t) => t._id === selectedTemplateId);
    if (!template || winners.length === 0) return;

    setGenerating(true);
    const pdfInstance = { current: null };

    try {
      for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        setStatus(`Rendering certificate ${i + 1} of ${winners.length}: ${winner.participant?.name}...`);
        
        await drawCertificateOnCanvas(winner, template);
        const canvas = canvasRef.current;
        const imgData = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;

        const orientation = width > height ? 'l' : 'p';

        if (i === 0) {
          pdfInstance.current = new jsPDF(orientation, 'px', [width, height]);
        } else {
          pdfInstance.current.addPage([width, height], orientation);
        }
        
        pdfInstance.current.addImage(imgData, 'PNG', 0, 0, width, height);
      }

      setStatus('Saving PDF file...');
      pdfInstance.current.save(`bulk_certificates_event_${selectedEventId}.pdf`);
      setStatus('');
    } catch (err) {
      console.error(err);
      setError('Bulk generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/admin" className="p-2 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Certificate Generator</h1>
          <p className="text-slate-400 mt-1 font-medium">Issue and export printable certificates in bulk.</p>
        </div>
      </div>

      {templates.length === 0 && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <span>
            Please configure at least one **Certificate Template** in the{' '}
            <Link to="/admin/certificates" className="font-bold underline text-white">
              Template Section
            </Link>{' '}
            before using the generator.
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6 md:col-span-1 h-fit">
            <h2 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Layers className="w-4.5 h-4.5 text-indigo-400" />
              Certificate Options
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                >
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Event Results</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                >
                  <option value="">-- Choose Event --</option>
                  {events.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {winners.length > 0 && (
                <button
                  onClick={handleDownloadBulk}
                  disabled={generating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Download Bulk PDF ({winners.length})
                </button>
              )}
            </div>
          </div>

          {/* Winners stand list */}
          <div className="md:col-span-2 space-y-6">
            {generating && (
              <div className="p-4 bg-slate-900/80 border border-white/5 rounded-2xl flex items-center gap-3 text-indigo-400 text-sm">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-semibold">{status}</span>
              </div>
            )}

            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-slate-900/40">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" /> Event Winners List
                </h3>
              </div>

              {selectedEventId ? (
                winners.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {winners.map((w) => (
                      <div key={w._id} className="p-4 flex items-center justify-between hover:bg-slate-900/10 transition-colors">
                        <div>
                          <span className="text-xs font-bold text-white">{w.participant?.name}</span>
                          <span className="text-[10px] block font-semibold text-slate-500">
                            Unit: {w.participant?.unit?.name} | {w.position > 0 ? `Position #${w.position}` : 'Grade Point Only'} {w.grade ? `(Grade ${w.grade})` : ''}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDownloadSingle(w)}
                          disabled={generating}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-white/5 transition-all flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Certificate PDF
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No published results found for this event.
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Please select an event to list winners.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for off-screen rendering */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CertificateGenerator;
