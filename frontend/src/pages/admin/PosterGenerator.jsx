import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { jsPDF } from 'jspdf';
import { motion } from 'framer-motion';
import { Download, Layers, ShieldAlert, Award, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import PosterRenderer from '../../components/PosterRenderer';
import FilterBar from '../../components/FilterBar';

const PosterGenerator = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [result, setResult] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const fetchData = async () => {
    try {
      const [templatesRes, eventsRes, categoriesRes] = await Promise.all([
        api.get('/posters/templates'),
        api.get('/events'),
        api.get('/categories'),
      ]);

      if (templatesRes.data.success) {
        const temps = templatesRes.data.templates;
        setTemplates(temps);
        const defaultTemp = temps.find((t) => t.isDefault) || temps[0];
        setSelectedTemplateId(defaultTemp?._id || '');
      }

      if (eventsRes.data.success) {
        setEvents(eventsRes.data.events);
      }

      if (categoriesRes.data.success) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load assets for generator.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedEventId('');
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch results when Event is selected
  useEffect(() => {
    if (selectedEventId) {
      const loadEventResult = async () => {
        setError('');
        setResult(null);
        try {
          const res = await api.get(`/results/event/${selectedEventId}`);
          if (res.data.success) {
            setResult(res.data.result);
          }
        } catch (err) {
          console.error(err);
          setError('No published result found for the selected event.');
        }
      };
      loadEventResult();
    } else {
      setResult(null);
    }
  }, [selectedEventId]);

  const selectedTemplate = templates.find((t) => t._id === selectedTemplateId);

  const handleDownload = (format) => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;

    const eventNameClean = (result.event?.name || 'result').replace(/\s+/g, '_');

    if (format === 'png') {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventNameClean}_official_poster.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else if (format === 'pdf') {
      const imgData = canvas.toDataURL('image/png');
      const width = canvas.width;
      const height = canvas.height;

      const orientation = width > height ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'px', [width, height]);
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${eventNameClean}_official_poster.pdf`);
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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto text-left">
      <div className="flex items-center gap-3">
        <Link to="/admin/results" className="p-2 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Event Poster Generator</h1>
          <p className="text-slate-400 mt-1 font-medium">Export official event standings posters showing top 3 winners.</p>
        </div>
      </div>

      {templates.length === 0 && (
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 flex-shrink-0" />
          <span>
            Please configure at least one **Poster Template** in the{' '}
            <Link to="/admin/posters" className="font-bold underline text-white">
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
        <div className="space-y-6">
          <FilterBar
            search={search}
            setSearch={setSearch}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            events={events}
            selectedEvent={selectedEventId}
            setSelectedEvent={setSelectedEventId}
            onReset={handleReset}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls Panel */}
            <div className="lg:col-span-5 glass-card rounded-2xl border border-white/5 p-6 space-y-6">
              <h2 className="text-md font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Layers className="w-4.5 h-4.5 text-indigo-400" />
                Configure Poster
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Poster Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  >
                    {templates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} {t.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          {/* Canvas Preview Area */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-6">
            <div className="w-full flex justify-between items-center bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
              <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" /> Real-time Render View
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-white/5 shadow-2xl max-w-full overflow-hidden flex justify-center items-center">
              {result && selectedTemplate ? (
                <PosterRenderer
                  template={selectedTemplate}
                  data={result}
                  canvasRef={canvasRef}
                  className="max-w-full max-h-[50vh] object-contain rounded-lg border border-white/5 bg-slate-950"
                />
              ) : (
                <div className="text-slate-500 text-xs py-12">Select template and published event to preview poster</div>
              )}
            </div>

            {/* Export options */}
            <div className="w-full grid grid-cols-2 gap-4">
              <button
                onClick={() => handleDownload('png')}
                disabled={generating || !result || !selectedTemplate}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={generating || !result || !selectedTemplate}
                className="py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Award className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default PosterGenerator;
