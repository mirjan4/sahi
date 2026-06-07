import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, AlertCircle, Save, Settings, Layers, Image as ImageIcon } from 'lucide-react';
import { confirmDelete, showSuccess, showError } from '../../utils/swal';

const CertificateTemplateMgmt = () => {
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

  // Active configurations (interactive WYSIWYG)
  const [activeElement, setActiveElement] = useState('participantName');
  const [config, setConfig] = useState({
    participantName: { x: 50, y: 45, fontSize: 28, color: '#1e3a8a', align: 'center', fontWeight: 'bold' },
    eventName: { x: 50, y: 55, fontSize: 20, color: '#111827', align: 'center' },
    categoryName: { x: 50, y: 60, fontSize: 18, color: '#374151', align: 'center' },
    positionText: { x: 35, y: 68, fontSize: 20, color: '#b45309', align: 'center', fontWeight: 'bold' },
    gradeText: { x: 65, y: 68, fontSize: 20, color: '#047857', align: 'center', fontWeight: 'bold' },
  });

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/certificates/templates');
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load certificate templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleConfigChange = (element, field, value) => {
    setConfig({
      ...config,
      [element]: {
        ...config[element],
        [field]: value,
      },
    });
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

  const openAddForm = () => {
    setEditId(null);
    setName('');
    setBackgroundImageFile(null);
    setBackgroundPreview('');
    setIsDefault(false);
    setConfig({
      participantName: { x: 50, y: 45, fontSize: 28, color: '#1e3a8a', align: 'center', fontWeight: 'bold' },
      eventName: { x: 50, y: 55, fontSize: 20, color: '#111827', align: 'center' },
      categoryName: { x: 50, y: 60, fontSize: 18, color: '#374151', align: 'center' },
      positionText: { x: 35, y: 68, fontSize: 20, color: '#b45309', align: 'center', fontWeight: 'bold' },
      gradeText: { x: 65, y: 68, fontSize: 20, color: '#047857', align: 'center', fontWeight: 'bold' },
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
    setConfig(t.config);
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

    try {
      if (editId) {
        const res = await api.put(`/certificates/templates/${editId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data.success) {
          setShowForm(false);
          showSuccess('Template updated successfully.');
          fetchTemplates();
        }
      } else {
        const res = await api.post('/certificates/templates', formData, {
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
      const res = await api.delete(`/certificates/templates/${id}`);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Certificate Templates</h1>
          <p className="text-slate-400 mt-1 font-medium">Configure backgrounds and coordinate parameters for bulk printing certificates.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/admin/certificates/generate"
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold border border-white/5 transition-all flex items-center gap-2"
          >
            Open Certificate Generator
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

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : templates.length > 0 ? (
          templates.map((temp) => (
            <div key={temp._id} className="glass-card rounded-2xl overflow-hidden border border-white/5 flex flex-col justify-between">
              <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-white/5">
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
            <p className="text-sm">No templates configured yet. Create one to generate certificates!</p>
          </div>
        )}
      </div>

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
                  <Layers className="w-4.5 h-4.5" /> WYSIWYG Certificate Canvas Preview
                </h3>

                <div className="w-[400px] h-[300px] bg-slate-900 border border-white/10 rounded-xl relative overflow-hidden shadow-2xl">
                  {backgroundPreview ? (
                    <img src={backgroundPreview} alt="Preview Background" className="w-full h-full object-cover select-none pointer-events-none" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs">No background template uploaded</span>
                    </div>
                  )}

                  {/* Render Configuration overlays relative to preview box */}
                  {backgroundPreview && (
                    <>
                      <div
                        style={{
                          left: `${config.participantName.x}%`,
                          top: `${config.participantName.y}%`,
                          fontSize: `${config.participantName.fontSize * 0.4}px`, // scaled down for preview size
                          color: config.participantName.color,
                          fontWeight: config.participantName.fontWeight,
                          textAlign: config.participantName.align,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute select-none pointer-events-none whitespace-nowrap ${
                          activeElement === 'participantName' ? 'border border-dashed border-indigo-500 px-1 py-0.5 rounded bg-indigo-500/10' : ''
                        }`}
                      >
                        PARTICIPANT NAME
                      </div>

                      <div
                        style={{
                          left: `${config.eventName.x}%`,
                          top: `${config.eventName.y}%`,
                          fontSize: `${config.eventName.fontSize * 0.4}px`,
                          color: config.eventName.color,
                          fontWeight: config.eventName.fontWeight,
                          textAlign: config.eventName.align,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute select-none pointer-events-none whitespace-nowrap ${
                          activeElement === 'eventName' ? 'border border-dashed border-indigo-500 px-1 py-0.5 rounded bg-indigo-500/10' : ''
                        }`}
                      >
                        EVENT NAME
                      </div>

                      <div
                        style={{
                          left: `${config.categoryName.x}%`,
                          top: `${config.categoryName.y}%`,
                          fontSize: `${config.categoryName.fontSize * 0.4}px`,
                          color: config.categoryName.color,
                          fontWeight: config.categoryName.fontWeight,
                          textAlign: config.categoryName.align,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute select-none pointer-events-none whitespace-nowrap ${
                          activeElement === 'categoryName' ? 'border border-dashed border-indigo-500 px-1 py-0.5 rounded bg-indigo-500/10' : ''
                        }`}
                      >
                        CATEGORY NAME
                      </div>

                      <div
                        style={{
                          left: `${config.positionText.x}%`,
                          top: `${config.positionText.y}%`,
                          fontSize: `${config.positionText.fontSize * 0.4}px`,
                          color: config.positionText.color,
                          fontWeight: config.positionText.fontWeight,
                          textAlign: config.positionText.align,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute select-none pointer-events-none whitespace-nowrap ${
                          activeElement === 'positionText' ? 'border border-dashed border-indigo-500 px-1 py-0.5 rounded bg-indigo-500/10' : ''
                        }`}
                      >
                        POSITION STANDING
                      </div>

                      <div
                        style={{
                          left: `${config.gradeText.x}%`,
                          top: `${config.gradeText.y}%`,
                          fontSize: `${config.gradeText.fontSize * 0.4}px`,
                          color: config.gradeText.color,
                          fontWeight: config.gradeText.fontWeight,
                          textAlign: config.gradeText.align,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute select-none pointer-events-none whitespace-nowrap ${
                          activeElement === 'gradeText' ? 'border border-dashed border-indigo-500 px-1 py-0.5 rounded bg-indigo-500/10' : ''
                        }`}
                      >
                        GRADE RECORDED
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Side: Upload Form & Coordinator sliders */}
              <div className="w-full md:w-[450px] bg-slate-900 flex flex-col justify-between overflow-y-auto">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-indigo-400" />
                      Configure Certificate Coordinates
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
                        placeholder="e.g. Sahithyolsav 2026 Certificate"
                        className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-white/5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Upload Background Image *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-400 border border-white/5 p-2 rounded-lg bg-slate-950"
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="cert-default-check"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="text-indigo-600 rounded border-white/10"
                      />
                      <label htmlFor="cert-default-check" className="text-[11px] font-bold text-slate-300 select-none cursor-pointer">
                        Mark as default template for certificate printing
                      </label>
                    </div>

                    {/* Element Selector */}
                    <div className="border-t border-white/5 pt-4">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Text Overlay to Customize</label>
                      <div className="grid grid-cols-2 gap-2">
                        {textElementsKeys.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setActiveElement(key)}
                            className={`px-3 py-2 rounded-lg text-left text-xs font-semibold transition-all ${
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
                    {activeElement && (
                      <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-3 animate-slide-up">
                        <h4 className="text-xs font-bold text-indigo-400 capitalize">
                          Adjusting: {activeElement.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Horizontal Coordinate (X)</span>
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
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Vertical Coordinate (Y)</span>
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

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Font Size (px)</span>
                            </div>
                            <input
                              type="number"
                              value={config[activeElement].fontSize}
                              onChange={(e) => handleConfigChange(activeElement, 'fontSize', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-white/5 text-white font-bold text-xs"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                              <span>Color</span>
                            </div>
                            <input
                              type="color"
                              value={config[activeElement].color}
                              onChange={(e) => handleConfigChange(activeElement, 'color', e.target.value)}
                              className="w-full h-8 px-1 rounded bg-slate-900 border border-white/5 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Alignment</span>
                          </div>
                          <div className="flex gap-2">
                            {['left', 'center', 'right'].map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => handleConfigChange(activeElement, 'align', align)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold capitalize border transition-all ${
                                  config[activeElement].align === align
                                    ? 'bg-slate-800 text-indigo-400 border-indigo-500/20'
                                    : 'bg-transparent text-slate-500 border-white/5 hover:text-white'
                                }`}
                              >
                                {align}
                              </button>
                            ))}
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

export default CertificateTemplateMgmt;
