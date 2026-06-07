import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Save, Settings, Layers, Image as ImageIcon, Upload, Search } from 'lucide-react';
import PosterRenderer from '../../components/PosterRenderer';
import PaginationBar from '../../components/PaginationBar';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const PosterTemplateMgmt = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [backgroundImageFile, setBackgroundImageFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Symbols Upload states
  const [firstSymbolFile, setFirstSymbolFile] = useState(null);
  const [secondSymbolFile, setSecondSymbolFile] = useState(null);
  const [thirdSymbolFile, setThirdSymbolFile] = useState(null);

  const [firstSymbolPreview, setFirstSymbolPreview] = useState('');
  const [secondSymbolPreview, setSecondSymbolPreview] = useState('');
  const [thirdSymbolPreview, setThirdSymbolPreview] = useState('');

  // Drag and Drop WYSIWYG states
  const dragContainerRef = useRef(null);
  const [draggingKey, setDraggingKey] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Active configurations (interactive WYSIWYG)
  const [activeElement, setActiveElement] = useState('firstWinner');
  const [config, setConfig] = useState({
    eventName: { type: 'text', x: 50, y: 30, fontSize: 24, color: '#000000', align: 'center', fontWeight: 'bold', zIndex: 1 },
    categoryName: { type: 'text', x: 50, y: 22, fontSize: 20, color: '#374151', align: 'center', zIndex: 1 },
    resultNumber: { type: 'text', x: 80, y: 12, fontSize: 16, color: '#4b5563', align: 'right', zIndex: 1 },
    firstWinner: { type: 'text', x: 50, y: 45, fontSize: 28, color: '#d97706', align: 'center', fontWeight: 'bold', zIndex: 2 },
    secondWinner: { type: 'text', x: 50, y: 60, fontSize: 24, color: '#4b5563', align: 'center', zIndex: 2 },
    thirdWinner: { type: 'text', x: 50, y: 75, fontSize: 24, color: '#b45309', align: 'center', zIndex: 2 },
    
    firstWinnerSymbol: { type: 'symbol', x: 38, y: 45, size: 40, opacity: 1, zIndex: 3, librarySymbol: 'medal_gold' },
    secondWinnerSymbol: { type: 'symbol', x: 40, y: 60, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_silver' },
    thirdWinnerSymbol: { type: 'symbol', x: 40, y: 75, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_bronze' },
  });

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/posters/templates', {
        params: {
          page,
          limit,
          search: debouncedSearch,
        },
      });
      if (res.data.success) {
        setTemplates(res.data.templates);
        setTotalRecords(res.data.totalRecords || 0);
        setTotalPages(res.data.totalPages || 0);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load poster templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, limit, debouncedSearch]);

  // Drag coordinates calculator
  const handleElementMouseDown = (key, e) => {
    e.preventDefault();
    setActiveElement(key);
    setDraggingKey(key);
  };

  const handleMouseMove = (e) => {
    if (!draggingKey || !dragContainerRef.current) return;
    
    const container = dragContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Mouse coords relative to preview container
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to percentage
    let pctX = Math.round((mouseX / rect.width) * 100);
    let pctY = Math.round((mouseY / rect.height) * 100);
    
    pctX = Math.max(0, Math.min(100, pctX));
    pctY = Math.max(0, Math.min(100, pctY));
    
    setConfig((prev) => ({
      ...prev,
      [draggingKey]: {
        ...prev[draggingKey],
        x: pctX,
        y: pctY,
      },
    }));
  };

  const handleMouseUp = () => {
    setDraggingKey(null);
  };

  useEffect(() => {
    if (draggingKey) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingKey]);

  const handleConfigChange = (element, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [element]: {
        ...prev[element],
        [field]: value,
      },
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackgroundImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSymbolFileChange = (position, file) => {
    if (!file) return;
    if (position === 'first') {
      setFirstSymbolFile(file);
      setFirstSymbolPreview(URL.createObjectURL(file));
    } else if (position === 'second') {
      setSecondSymbolFile(file);
      setSecondSymbolPreview(URL.createObjectURL(file));
    } else if (position === 'third') {
      setThirdSymbolFile(file);
      setThirdSymbolPreview(URL.createObjectURL(file));
    }
  };

  const getLocalSymbolsMap = () => {
    const m = new Map();
    if (editId) {
      const activeTemp = templates.find((t) => t._id === editId);
      if (activeTemp && activeTemp.symbols) {
        // Convert to plain object if needed
        const rawSymbols = activeTemp.symbols.toJSON ? activeTemp.symbols.toJSON() : activeTemp.symbols;
        Object.keys(rawSymbols).forEach((k) => {
          m.set(k, rawSymbols[k]);
        });
      }
    }
    if (firstSymbolPreview) m.set('firstSymbol', firstSymbolPreview);
    if (secondSymbolPreview) m.set('secondSymbol', secondSymbolPreview);
    if (thirdSymbolPreview) m.set('thirdSymbol', thirdSymbolPreview);
    return m;
  };

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setBackgroundImageFile(null);
    setBackgroundPreview('');
    setIsDefault(false);
    
    setFirstSymbolFile(null);
    setSecondSymbolFile(null);
    setThirdSymbolFile(null);
    setFirstSymbolPreview('');
    setSecondSymbolPreview('');
    setThirdSymbolPreview('');

    setConfig({
      eventName: { type: 'text', x: 50, y: 30, fontSize: 24, color: '#000000', align: 'center', fontWeight: 'bold', zIndex: 1 },
      categoryName: { type: 'text', x: 50, y: 22, fontSize: 20, color: '#374151', align: 'center', zIndex: 1 },
      resultNumber: { type: 'text', x: 80, y: 12, fontSize: 16, color: '#4b5563', align: 'right', zIndex: 1 },
      firstWinner: { type: 'text', x: 50, y: 45, fontSize: 28, color: '#d97706', align: 'center', fontWeight: 'bold', zIndex: 2 },
      secondWinner: { type: 'text', x: 50, y: 60, fontSize: 24, color: '#4b5563', align: 'center', zIndex: 2 },
      thirdWinner: { type: 'text', x: 50, y: 75, fontSize: 24, color: '#b45309', align: 'center', zIndex: 2 },
      
      firstWinnerSymbol: { type: 'symbol', x: 38, y: 45, size: 40, opacity: 1, zIndex: 3, librarySymbol: 'medal_gold' },
      secondWinnerSymbol: { type: 'symbol', x: 40, y: 60, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_silver' },
      thirdWinnerSymbol: { type: 'symbol', x: 40, y: 75, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_bronze' },
    });
    setFormError('');
    setShowForm(true);
  };

  const openEditForm = (t) => {
    setEditId(t._id);
    setName(t.name);
    setBackgroundImageFile(null);
    setBackgroundPreview(t.backgroundImage);
    setIsDefault(t.isDefault);
    
    // Clear files selector
    setFirstSymbolFile(null);
    setSecondSymbolFile(null);
    setThirdSymbolFile(null);

    // Read saved symbol file URLs
    const rawSymbols = t.symbols ? (t.symbols.toJSON ? t.symbols.toJSON() : t.symbols) : {};
    setFirstSymbolPreview(rawSymbols.firstSymbol || '');
    setSecondSymbolPreview(rawSymbols.secondSymbol || '');
    setThirdSymbolPreview(rawSymbols.thirdSymbol || '');

    // Convert config Map to JSON object
    const rawConfig = t.config ? (t.config.toJSON ? t.config.toJSON() : t.config) : {};
    
    // Backwards-compatible fallback (inject default symbols if older template doesn't have them)
    const mergedConfig = {
      firstWinnerSymbol: { type: 'symbol', x: 38, y: 45, size: 40, opacity: 1, zIndex: 3, librarySymbol: 'medal_gold' },
      secondWinnerSymbol: { type: 'symbol', x: 40, y: 60, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_silver' },
      thirdWinnerSymbol: { type: 'symbol', x: 40, y: 75, size: 36, opacity: 1, zIndex: 3, librarySymbol: 'medal_bronze' },
      ...rawConfig
    };

    setConfig(mergedConfig);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!name) {
      setFormError('Please add a template name.');
      setIsSubmitting(false);
      return;
    }

    if (!editId && !backgroundImageFile) {
      setFormError('Please upload a template background image.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('config', JSON.stringify(config));
    formData.append('isDefault', String(isDefault));
    
    if (backgroundImageFile) {
      formData.append('backgroundImage', backgroundImageFile);
    }
    if (firstSymbolFile) {
      formData.append('firstSymbol', firstSymbolFile);
    }
    if (secondSymbolFile) {
      formData.append('secondSymbol', secondSymbolFile);
    }
    if (thirdSymbolFile) {
      formData.append('thirdSymbol', thirdSymbolFile);
    }

    try {
      if (editId) {
        const res = await api.put(`/posters/templates/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Template updated successfully.');
          fetchTemplates();
        }
      } else {
        const res = await api.post('/posters/templates', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Template created successfully.');
          fetchTemplates();
        }
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save template.');
      showError('Failed to Save Data', 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete(
      'Delete Template?',
      'Are you sure you want to delete this template?'
    );
    if (!confirmed) return;

    try {
      const res = await api.delete(`/posters/templates/${id}`);
      if (res.data.success) {
        showSuccess('Template deleted successfully.');
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
      setError('Delete failed.');
      showError('Delete Failed', 'Please try again.');
    }
  };

  const textElementsKeys = Object.keys(config);

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Poster Templates</h1>
          <p className="text-slate-400 mt-1 font-medium">Design and calibrate custom positioning overlays on poster assets.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/posters/generate"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold border border-white/5 transition-all flex items-center gap-2"
          >
            Open Poster Generator
          </Link>
          <button
            onClick={openAddForm}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold tracking-wide flex items-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates by name..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-white/5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
        />
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : templates.length > 0 ? (
          templates.map((temp) => (
            <div key={temp._id} className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between">
              <div className="aspect-[4/5] bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-white/5">
                {temp.backgroundImage ? (
                  <img src={temp.backgroundImage} alt={temp.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-700" />
                )}
                {temp.isDefault && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-indigo-600 border border-indigo-500/30 text-white text-[9px] font-extrabold uppercase tracking-wide">
                    Default
                  </span>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[150px]">{temp.name}</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Configured text overlays</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditForm(temp)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(temp._id)}
                    className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500">
            <Layers className="w-10 h-10 mx-auto text-slate-600 mb-3" />
            <p className="text-sm">No templates configured yet. Create one to generate posters!</p>
          </div>
        )}
      </div>

      <PaginationBar
        currentPage={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setPage(1); setLimit(l); }}
      />

      {/* WYSIWYG Config / Upload Form Modal Overlay */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl w-full max-w-6xl h-[90vh] border border-white/10 flex flex-col md:flex-row overflow-hidden shadow-2xl"
            >
              {/* Left Side: WYSIWYG Visual Canvas Preview */}
              <div className="flex-1 bg-slate-950 p-6 flex flex-col justify-center items-center border-r border-white/5 relative overflow-hidden">
                <h3 className="absolute top-4 left-6 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5" /> WYSIWYG Interactive Editor (Drag Elements)
                </h3>

                <div
                  ref={dragContainerRef}
                  className="w-[300px] h-[375px] bg-slate-900 border border-white/10 rounded-xl relative overflow-hidden shadow-2xl flex items-center justify-center p-2 select-none"
                >
                  {backgroundPreview ? (
                    <PosterRenderer
                      template={{ backgroundImage: backgroundPreview, symbols: getLocalSymbolsMap() }}
                      coordinates={config}
                      onElementMouseDown={handleElementMouseDown}
                      selectedElement={activeElement}
                      className="max-w-full max-h-full object-contain rounded-lg border border-white/5 bg-slate-950"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs">No template background uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Upload Form & Coordinator sliders */}
              <div className="w-full md:w-[450px] bg-slate-900 flex flex-col justify-between overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-indigo-400" />
                      Configure Overlay Layout
                    </h2>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Template Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Arabic Festival Template"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Poster Background *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="bg-image-file"
                        />
                        <label htmlFor="bg-image-file" className="w-full h-10 flex items-center justify-center rounded-lg bg-slate-950 border border-white/5 hover:border-indigo-500/40 cursor-pointer text-xs text-slate-400 gap-1.5">
                          <Upload className="w-3.5 h-3.5" /> {backgroundImageFile ? 'File Selected' : 'Choose Background'}
                        </label>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="temp-default-check"
                          checked={isDefault}
                          onChange={(e) => setIsDefault(e.target.checked)}
                          className="text-indigo-600 rounded border-white/10 focus:ring-0"
                        />
                        <label htmlFor="temp-default-check" className="text-[10px] font-bold text-slate-300 select-none cursor-pointer">
                          Mark as default
                        </label>
                      </div>
                    </div>

                    {/* Custom symbols upload fields */}
                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Custom Symbols (Optional)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] text-slate-500 font-bold mb-1">1st Place</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSymbolFileChange('first', e.target.files[0])}
                            className="hidden"
                            id="first-symbol-upload"
                          />
                          <label htmlFor="first-symbol-upload" className="w-full h-12 flex flex-col items-center justify-center rounded-lg bg-slate-950 border border-white/5 hover:border-indigo-500/40 cursor-pointer text-[9px] text-slate-400 text-center p-1 truncate">
                            {firstSymbolFile ? firstSymbolFile.name.substring(0, 8) + '...' : firstSymbolPreview ? 'Custom Saved' : 'Upload File'}
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] text-slate-500 font-bold mb-1">2nd Place</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSymbolFileChange('second', e.target.files[0])}
                            className="hidden"
                            id="second-symbol-upload"
                          />
                          <label htmlFor="second-symbol-upload" className="w-full h-12 flex flex-col items-center justify-center rounded-lg bg-slate-950 border border-white/5 hover:border-indigo-500/40 cursor-pointer text-[9px] text-slate-400 text-center p-1 truncate">
                            {secondSymbolFile ? secondSymbolFile.name.substring(0, 8) + '...' : secondSymbolPreview ? 'Custom Saved' : 'Upload File'}
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-[9px] text-slate-500 font-bold mb-1">3rd Place</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSymbolFileChange('third', e.target.files[0])}
                            className="hidden"
                            id="third-symbol-upload"
                          />
                          <label htmlFor="third-symbol-upload" className="w-full h-12 flex flex-col items-center justify-center rounded-lg bg-slate-950 border border-white/5 hover:border-indigo-500/40 cursor-pointer text-[9px] text-slate-400 text-center p-1 truncate">
                            {thirdSymbolFile ? thirdSymbolFile.name.substring(0, 8) + '...' : thirdSymbolPreview ? 'Custom Saved' : 'Upload File'}
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Element Selector */}
                    <div className="border-t border-white/5 pt-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Overlay Element to Calibrate</label>
                      <div className="grid grid-cols-2 gap-2">
                        {textElementsKeys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActiveElement(key)}
                            className={`px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all truncate ${
                              activeElement === key
                                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md'
                                : 'bg-slate-950 text-slate-400 border border-white/5 hover:text-white'
                            }`}
                          >
                            {key.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, (c) => c.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Coordinate sliders block */}
                    {activeElement && config[activeElement] && (
                      <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-4 animate-slide-up">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-indigo-400 capitalize">
                            Adjusting: {activeElement.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[8px] text-slate-400 uppercase font-black">
                            {config[activeElement].type || 'text'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                              <span>Horizontal (X)</span>
                              <span className="text-white font-bold">{config[activeElement].x}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config[activeElement].x}
                              onChange={(e) => handleConfigChange(activeElement, 'x', Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                              <span>Vertical (Y)</span>
                              <span className="text-white font-bold">{config[activeElement].y}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config[activeElement].y}
                              onChange={(e) => handleConfigChange(activeElement, 'y', Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Text fields custom parameters */}
                        {config[activeElement].type !== 'symbol' ? (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Font Size (px)</label>
                                <input
                                  type="number"
                                  value={config[activeElement].fontSize || 24}
                                  onChange={(e) => handleConfigChange(activeElement, 'fontSize', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-bold text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
                                <input
                                  type="color"
                                  value={config[activeElement].color || '#000000'}
                                  onChange={(e) => handleConfigChange(activeElement, 'color', e.target.value)}
                                  className="w-full h-8 px-1 rounded bg-slate-900 border border-white/5 cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Alignment</label>
                                <select
                                  value={config[activeElement].align || 'center'}
                                  onChange={(e) => handleConfigChange(activeElement, 'align', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-semibold text-xs focus:outline-none"
                                >
                                  <option value="left">Left</option>
                                  <option value="center">Center</option>
                                  <option value="right">Right</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Font Weight</label>
                                <select
                                  value={config[activeElement].fontWeight || 'normal'}
                                  onChange={(e) => handleConfigChange(activeElement, 'fontWeight', e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-semibold text-xs focus:outline-none"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="medium">Medium</option>
                                  <option value="bold">Bold</option>
                                </select>
                              </div>
                            </div>
                          </>
                        ) : (
                          /* Symbol custom parameters */
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Symbol Size (px)</label>
                                <input
                                  type="number"
                                  value={config[activeElement].size || 40}
                                  onChange={(e) => handleConfigChange(activeElement, 'size', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-bold text-xs"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Opacity (0 - 1)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={config[activeElement].opacity ?? 1}
                                  onChange={(e) => handleConfigChange(activeElement, 'opacity', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-bold text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] text-slate-400 mb-1">Default Medal Library</label>
                              <select
                                value={config[activeElement].librarySymbol || 'medal_gold'}
                                onChange={(e) => handleConfigChange(activeElement, 'librarySymbol', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-semibold text-xs focus:outline-none"
                              >
                                <option value="custom">Custom Uploaded File</option>
                                <optgroup label="Medals">
                                  <option value="medal_gold">Gold Medal (🥇)</option>
                                  <option value="medal_silver">Silver Medal (🥈)</option>
                                  <option value="medal_bronze">Bronze Medal (🥉)</option>
                                </optgroup>
                                <optgroup label="Trophies">
                                  <option value="trophy_gold">Gold Trophy (🏆)</option>
                                  <option value="trophy_silver">Silver Trophy</option>
                                  <option value="trophy_bronze">Bronze Trophy</option>
                                </optgroup>
                                <optgroup label="Stars">
                                  <option value="star_gold">Gold Star (⭐)</option>
                                  <option value="star_silver">Silver Star</option>
                                  <option value="star_bronze">Bronze Star</option>
                                </optgroup>
                                <optgroup label="Circles">
                                  <option value="circle_gold">Gold Circle</option>
                                  <option value="circle_silver">Silver Circle</option>
                                  <option value="circle_bronze">Bronze Circle</option>
                                </optgroup>
                                <optgroup label="Premium Badges">
                                  <option value="badge_gold">Gold Badge</option>
                                  <option value="badge_silver">Silver Badge</option>
                                  <option value="badge_bronze">Bronze Badge</option>
                                </optgroup>
                              </select>
                            </div>
                          </>
                        )}

                        {/* Layer order (zIndex adjustment) */}
                        <div className="border-t border-white/5 pt-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Layer Ordering (zIndex)</label>
                          <div className="flex gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => handleConfigChange(activeElement, 'zIndex', Math.max(1, (config[activeElement].zIndex || 1) - 1))}
                              className="px-3 py-1.5 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white text-xs font-bold flex-1"
                              title="Send Backward"
                            >
                              Send Backward
                            </button>
                            <input
                              type="number"
                              value={config[activeElement].zIndex || 1}
                              className="w-12 text-center py-1.5 rounded bg-slate-900 border border-white/5 text-white font-bold text-xs outline-none"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleConfigChange(activeElement, 'zIndex', (config[activeElement].zIndex || 1) + 1)}
                              className="px-3 py-1.5 rounded bg-slate-900 border border-white/5 text-slate-400 hover:text-white text-xs font-bold flex-1"
                              title="Bring Forward"
                            >
                              Bring Forward
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-slate-900/60 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                    <Save className="w-4 h-4" />
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PosterTemplateMgmt;
