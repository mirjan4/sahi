import React, { useState, useEffect, useRef } from 'react';
import { getSymbolSVGContent, getSymbolDataURL } from '../utils/symbolLibrary';

const PosterRenderer = ({
  template,
  coordinates,
  data,
  canvasRef,
  className,
  onElementMouseDown,
  selectedElement,
}) => {
  const localCanvasRef = useRef(null);
  const activeCanvasRef = canvasRef || localCanvasRef;
  const containerRef = useRef(null);

  const activeConfig = coordinates || (template?.config ? (template.config.toJSON ? template.config.toJSON() : template.config) : {});

  const [dimensions, setDimensions] = useState({
    width: 0,
    naturalWidth: 1,
    naturalHeight: 1,
  });

  const handleImageLoad = (e) => {
    const img = e.target;
    setDimensions({
      width: containerRef.current ? containerRef.current.getBoundingClientRect().width : img.clientWidth,
      naturalWidth: img.naturalWidth || 1,
      naturalHeight: img.naturalHeight || 1,
    });
  };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions((prev) => ({
          ...prev,
          width: rect.width,
        }));
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getWinnerData = (elementKey) => {
    const posMap = { firstWinner: 1, secondWinner: 2, thirdWinner: 3 };
    const posNum = posMap[elementKey];
    if (!posNum) return null;

    if (!data) {
      const fallbacks = {
        firstWinner: { name: '1ST WINNER NAME', team: 'SECTOR ALPHA' },
        secondWinner: { name: '2ND WINNER NAME', team: 'SECTOR BETA' },
        thirdWinner: { name: '3RD WINNER NAME', team: 'SECTOR GAMMA' },
      };
      return fallbacks[elementKey] || null;
    }

    const winnersByPos = { 1: [], 2: [], 3: [] };
    if (data.winners && Array.isArray(data.winners)) {
      data.winners.forEach((w) => {
        if (w.position >= 1 && w.position <= 3) {
          winnersByPos[w.position].push(w);
        }
      });
    }

    const winners = winnersByPos[posNum];
    if (winners.length === 0) return null;

    return {
      name: winners.map((w) => w.participant?.name || '').join(', '),
      team: winners.map((w) => w.participant?.unit?.name || '').join(', '),
    };
  };

  const getTextForElement = (elementKey) => {
    if (!data) {
      const fallbacks = {
        eventName: 'EVENT NAME',
        categoryName: 'CATEGORY NAME',
        resultNumber: 'RESULT NO: 101',
      };
      return fallbacks[elementKey] || '';
    }

    if (elementKey === 'eventName') {
      return data.event?.name || '';
    }
    if (elementKey === 'categoryName') {
      return data.event?.category?.name || '';
    }
    if (elementKey === 'resultNumber') {
      return `RES-${data._id ? data._id.substring(data._id.length - 6).toUpperCase() : 'XXXXXX'}`;
    }

    return '';
  };

  const getSymbolSource = (elementKey, fontConfig) => {
    // Map elementKey (firstWinnerSymbol) to symbols map key (firstSymbol)
    const symbolMap = {
      firstWinnerSymbol: 'firstSymbol',
      secondWinnerSymbol: 'secondSymbol',
      thirdWinnerSymbol: 'thirdSymbol',
    };
    const symbolField = symbolMap[elementKey];
    
    // Check custom uploaded file
    let customUrl = null;
    if (template && template.symbols) {
      if (typeof template.symbols.get === 'function') {
        customUrl = template.symbols.get(symbolField);
      } else {
        customUrl = template.symbols[symbolField];
      }
    }

    if (customUrl) {
      return { type: 'custom', url: customUrl };
    }

    // Default library SVG
    const librarySymbol = fontConfig.librarySymbol || 'medal_gold';
    return { type: 'library', key: librarySymbol };
  };

  const preloadImages = (urls) => {
    return Promise.all(
      urls.map((item) => {
        return new Promise((resolve) => {
          if (!item || !item.url) return resolve({ key: item?.key, img: null });
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = item.url;
          img.onload = () => resolve({ key: item.key, img });
          img.onerror = () => resolve({ key: item.key, img: null });
        });
      })
    );
  };

  const drawCanvas = () => {
    const canvas = activeCanvasRef.current;
    if (!canvas || !template || !template.backgroundImage) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = template.backgroundImage;

    img.onload = async () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw background image
      ctx.drawImage(img, 0, 0);

      // Collect symbol urls to preload
      const imagesToPreload = [];
      Object.keys(activeConfig).forEach((key) => {
        const fontConfig = activeConfig[key];
        if (!fontConfig || fontConfig.type !== 'symbol') return;
        
        const src = getSymbolSource(key, fontConfig);
        if (src.type === 'custom') {
          imagesToPreload.push({ key, url: src.url });
        } else {
          // Convert library SVG string to base64 Data URL
          const dataUrl = getSymbolDataURL(src.key, fontConfig.size || 40, fontConfig.opacity || 1);
          imagesToPreload.push({ key, url: dataUrl });
        }
      });

      const preloaded = await preloadImages(imagesToPreload);
      const imageCache = {};
      preloaded.forEach((item) => {
        if (item.img) imageCache[item.key] = item.img;
      });

      document.fonts.ready.then(() => {
        // Sort elements by zIndex ascending so we draw them layered correctly
        const sortedKeys = Object.keys(activeConfig).sort((a, b) => {
          const zA = activeConfig[a]?.zIndex || 1;
          const zB = activeConfig[b]?.zIndex || 1;
          return zA - zB;
        });

        sortedKeys.forEach((key) => {
          const fontConfig = activeConfig[key];
          if (!fontConfig) return;

          // Calculate coordinates as percentage of natural size
          const x = (fontConfig.x / 100) * canvas.width;
          const y = (fontConfig.y / 100) * canvas.height;
          
          if (fontConfig.type === 'symbol') {
            const size = fontConfig.size || 40;
            const opacity = fontConfig.opacity ?? 1;
            const preloadedImg = imageCache[key];

            if (preloadedImg) {
              ctx.save();
              ctx.globalAlpha = opacity;
              // Center symbol on coordinates
              ctx.drawImage(preloadedImg, x - size / 2, y - size / 2, size, size);
              ctx.restore();
            }
          } else {
            // Text rendering
            const isWinnerKey = ['firstWinner', 'secondWinner', 'thirdWinner'].includes(key);
            const winnerData = isWinnerKey ? getWinnerData(key) : null;
            const text = isWinnerKey ? (winnerData ? winnerData.name : '') : getTextForElement(key);
            
            if (!text) return;
            const size = fontConfig.fontSize || 24;

            if (isWinnerKey && winnerData) {
              // Draw Winner Name
              ctx.save();
              ctx.fillStyle = fontConfig.color || '#000000';
              ctx.textAlign = fontConfig.align || 'center';
              ctx.textBaseline = 'bottom';

              const weight = 'bold';
              ctx.font = `${weight} ${size}px 'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif`;
              
              const winnerY = y - (size * 0.05);
              ctx.fillText(winnerData.name, x, winnerY);
              ctx.restore();

              // Draw Team/Sector Name
              ctx.save();
              ctx.fillStyle = fontConfig.color || '#000000';
              ctx.textAlign = fontConfig.align || 'center';
              ctx.textBaseline = 'top';
              ctx.globalAlpha = 0.75; // reduced opacity

              const teamSize = size * 0.72;
              ctx.font = `500 ${teamSize}px 'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif`;
              
              const teamY = y + (size * 0.2);
              ctx.fillText(winnerData.team, x, teamY);
              ctx.restore();
            } else {
              // Draw regular elements (eventName, categoryName, etc.)
              ctx.save();
              ctx.fillStyle = fontConfig.color || '#000000';
              ctx.textAlign = fontConfig.align || 'center';
              ctx.textBaseline = 'middle'; // Vertically centers text

              const weight = fontConfig.fontWeight || 'normal';
              ctx.font = `${weight} ${size}px 'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif`;

              ctx.fillText(text, x, y);
              ctx.restore();
            }
          }
        });
      });
    };

    img.onerror = (err) => {
      console.error('Failed to load template background image in canvas draw:', err);
    };
  };

  // Redraw canvas on updates to keep export in sync
  useEffect(() => {
    drawCanvas();
  }, [template, activeConfig, data]);

  const aspect = dimensions.naturalWidth && dimensions.naturalHeight
    ? `${dimensions.naturalWidth} / ${dimensions.naturalHeight}`
    : 'auto';

  // Sort elements by zIndex ascending for HTML rendering
  const sortedKeys = Object.keys(activeConfig).sort((a, b) => {
    const zA = activeConfig[a]?.zIndex || 1;
    const zB = activeConfig[b]?.zIndex || 1;
    return zA - zB;
  });

  return (
    <div
      ref={containerRef}
      className={className || "w-full"}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        aspectRatio: aspect,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      {template && template.backgroundImage && (
        <>
          <img
            src={template.backgroundImage}
            alt="Poster Background"
            onLoad={handleImageLoad}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
              objectFit: 'cover',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          {sortedKeys.map((key) => {
            const fontConfig = activeConfig[key];
            if (!fontConfig) return null;

            const scale = dimensions.width / dimensions.naturalWidth;
            const size = (fontConfig.fontSize || fontConfig.size || 24) * scale;
            const opacity = fontConfig.opacity ?? 1;

            const isSelected = selectedElement === key;

            if (fontConfig.type === 'symbol') {
              const src = getSymbolSource(key, fontConfig);
              const spacing = (fontConfig.spacing || 0) * scale;

              return (
                <div
                  key={key}
                  onMouseDown={(e) => onElementMouseDown && onElementMouseDown(key, e)}
                  style={{
                    position: 'absolute',
                    left: `${fontConfig.x}%`,
                    top: `${fontConfig.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${size}px`,
                    height: `${size}px`,
                    opacity: opacity,
                    zIndex: fontConfig.zIndex || 3,
                    cursor: onElementMouseDown ? 'move' : 'default',
                    border: isSelected ? '2px dashed #6366f1' : 'none',
                    padding: isSelected ? '2px' : '0',
                    pointerEvents: onElementMouseDown ? 'auto' : 'none',
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {src.type === 'custom' ? (
                    <img src={src.url} alt={key} className="w-full h-full object-contain" style={{ pointerEvents: 'none' }} />
                  ) : (
                    <div
                      className="w-full h-full object-contain flex items-center justify-center"
                      style={{ pointerEvents: 'none' }}
                      dangerouslySetInnerHTML={{ __html: getSymbolSVGContent(src.key, size, 1) }}
                    />
                  )}
                </div>
              );
            }

            // Text element rendering
            const isWinnerKey = ['firstWinner', 'secondWinner', 'thirdWinner'].includes(key);
            const winnerData = isWinnerKey ? getWinnerData(key) : null;
            const text = isWinnerKey ? (winnerData ? winnerData.name : '') : getTextForElement(key);
            
            if (!text) return null;

            if (isWinnerKey && winnerData) {
              return (
                <div
                  key={key}
                  onMouseDown={(e) => onElementMouseDown && onElementMouseDown(key, e)}
                  style={{
                    position: 'absolute',
                    left: `${fontConfig.x}%`,
                    top: `${fontConfig.y}%`,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: fontConfig.align === 'left' ? 'flex-start' : fontConfig.align === 'right' ? 'flex-end' : 'center',
                    textAlign: fontConfig.align || 'center',
                    cursor: onElementMouseDown ? 'move' : 'default',
                    border: isSelected ? '2px dashed #6366f1' : 'none',
                    padding: isSelected ? '4px' : '0',
                    pointerEvents: onElementMouseDown ? 'auto' : 'none',
                    userSelect: 'none',
                    lineHeight: 1.1,
                    zIndex: fontConfig.zIndex || 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: `${size}px`,
                      fontWeight: 'bold',
                      color: fontConfig.color || '#000000',
                      fontFamily: "'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {winnerData.name}
                  </div>
                  <div
                    style={{
                      fontSize: `${size * 0.72}px`,
                      fontWeight: '500',
                      color: fontConfig.color || '#000000',
                      opacity: 0.75,
                      fontFamily: "'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif",
                      marginTop: `${size * 0.15}px`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {winnerData.team}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={key}
                onMouseDown={(e) => onElementMouseDown && onElementMouseDown(key, e)}
                style={{
                  position: 'absolute',
                  left: `${fontConfig.x}%`,
                  top: `${fontConfig.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${size}px`,
                  color: fontConfig.color || '#000000',
                  textAlign: fontConfig.align || 'center',
                  fontFamily: "'Cairo', 'Manjari', 'Inter', 'Outfit', sans-serif",
                  fontWeight: fontConfig.fontWeight || 'normal',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  cursor: onElementMouseDown ? 'move' : 'default',
                  border: isSelected ? '2px dashed #6366f1' : 'none',
                  padding: isSelected ? '2px' : '0',
                  pointerEvents: onElementMouseDown ? 'auto' : 'none',
                  userSelect: 'none',
                  zIndex: fontConfig.zIndex || 1,
                }}
              >
                {text}
              </div>
            );
          })}
        </>
      )}

      {/* Hidden canvas for PNG & PDF exports */}
      <canvas
        ref={activeCanvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default PosterRenderer;
