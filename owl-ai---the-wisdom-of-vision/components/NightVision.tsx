
import React, { useState, useRef, useEffect } from 'react';
import { analyzeImage, generateNeuralThumbnail } from '../services/geminiService';

interface HistoryItem {
  id: string;
  image: string;
  thumbnail?: string;
  analysis: string;
  timestamp: number;
  isGeneratingThumb?: boolean;
}

const NightVision: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAutoScan, setIsAutoScan] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('owl_vision_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage when it changes
  useEffect(() => {
    localStorage.setItem('owl_vision_history', JSON.stringify(history));
  }, [history]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }, 
        audio: false 
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setAnalysis(null);
        setImage(null);
        setZoomLevel(1); 
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      videoTrackRef.current = null;
    }
    setIsCameraActive(false);
    setIsAutoScan(false);
  };

  useEffect(() => {
    if (videoTrackRef.current && isCameraActive) {
      const track = videoTrackRef.current;
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        track.applyConstraints({
          advanced: [{ zoom: zoomLevel }]
        } as any).catch(e => console.warn("Hardware zoom failed:", e));
      }
    }
  }, [zoomLevel, isCameraActive]);

  useEffect(() => {
    let interval: any;
    if (isAutoScan && isCameraActive && !isLoading) {
      interval = setInterval(() => {
        analyzeCurrentFrame("Perform a periodic surveillance scan of this live feed. Identify movements or changes.");
      }, 7000);
    }
    return () => clearInterval(interval);
  }, [isAutoScan, isCameraActive, isLoading]);

  const addToHistory = async (img: string, text: string) => {
    const id = crypto.randomUUID();
    const newItem: HistoryItem = {
      id,
      image: img,
      thumbnail: undefined, // Will be generated
      analysis: text,
      timestamp: Date.now(),
      isGeneratingThumb: true
    };
    
    // Add immediately with placeholder
    setHistory(prev => [newItem, ...prev].slice(0, 20));

    // Generate representative neural thumbnail asynchronously
    try {
      const aiThumb = await generateNeuralThumbnail(text);
      if (aiThumb) {
        setHistory(prev => prev.map(item => 
          item.id === id ? { ...item, thumbnail: aiThumb, isGeneratingThumb: false } : item
        ));
      } else {
        setHistory(prev => prev.map(item => 
          item.id === id ? { ...item, isGeneratingThumb: false } : item
        ));
      }
    } catch (err) {
      console.error("Failed to add AI thumbnail to history:", err);
      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, isGeneratingThumb: false } : item
      ));
    }
  };

  const analyzeCurrentFrame = async (prompt?: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        const result = await analyzeImage(base64, prompt || "Analyze this live visual stream frame with the precision of an owl. What is appearing in the current view?");
        const analysisText = result || "Analyzing...";
        setAnalysis(analysisText);
        addToHistory(dataUrl, analysisText);
      }
    } catch (error) {
      console.error(error);
      setAnalysis("Analysis failed. The darkness is too deep.");
    } finally {
      setIsLoading(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const saveImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `owl-ai-scan-${new Date().getTime()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setIsCameraActive(false);
        setZoomLevel(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!image) return;
    setIsLoading(true);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzeImage(base64);
      const analysisText = result || "The shadows kept their secrets.";
      setAnalysis(analysisText);
      addToHistory(image, analysisText);
    } catch (error) {
      console.error(error);
      setAnalysis("Vision obscured by the darkness.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setImage(item.image);
    setAnalysis(item.analysis);
    setIsCameraActive(false);
    setIsAutoScan(false);
    setIsHistoryOpen(false);
  };

  const clearHistory = () => {
    if (confirm("Purge all recorded visual history?")) {
      setHistory([]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12 px-4 relative">
      {/* Sidebar Overlay */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-300"
          onClick={() => setIsHistoryOpen(false)}
        ></div>
      )}

      {/* History Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#0a0c10] border-l border-white/10 z-[70] shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-display font-bold text-white uppercase tracking-wider">Neural Archive</h3>
          </div>
          <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4 px-8">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-xs uppercase tracking-widest font-black">Memory banks empty</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                onClick={() => loadFromHistory(item)}
                className="group p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 hover:bg-white/10 transition-all cursor-pointer flex gap-4"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/5 relative">
                  <img 
                    src={item.thumbnail || item.image} 
                    className={`w-full h-full object-cover transition-all duration-1000 ${item.thumbnail ? 'opacity-100' : 'opacity-40 grayscale blur-[2px]'}`} 
                    alt="History" 
                  />
                  {item.isGeneratingThumb && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border border-amber-500/50 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {item.thumbnail && (
                    <div className="absolute top-1 right-1">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[9px] font-mono text-amber-500/50 uppercase mb-1 flex items-center gap-2">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {item.thumbnail && <span className="text-[8px] bg-amber-500/10 px-1 rounded text-amber-500">AI_SYNC</span>}
                  </span>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed italic">
                    {item.analysis}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/20">
            <button 
              onClick={clearHistory}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Purge Memory Banks
            </button>
          </div>
        )}
      </aside>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="text-center flex-1">
            <h2 className="text-4xl font-display font-bold text-white mb-2 uppercase tracking-tighter">Night Vision Scan</h2>
            <p className="text-slate-400">Advanced thermal-spectral imaging with AI neural mapping.</p>
          </div>
          <div className="flex-1 flex justify-end">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-amber-500 transition-all group relative"
              title="View History"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[9px] font-black rounded-full flex items-center justify-center animate-in zoom-in">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className={`aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative bg-black shadow-2xl ${
              (image || isCameraActive) ? 'border-amber-500/40' : 'border-white/10 hover:border-white/20'
            }`}>
              
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                {isCameraActive ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.1s linear' }}
                    className="w-full h-full object-cover origin-center"
                  />
                ) : image ? (
                  <img 
                    src={image} 
                    style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.1s linear' }}
                    className="w-full h-full object-cover origin-center" 
                    alt="Scan target" 
                  />
                ) : (
                  <div className="flex flex-col items-center gap-6 p-8">
                    <div className="flex flex-wrap justify-center gap-4">
                      <button 
                        onClick={startCamera}
                        className="flex flex-col items-center gap-3 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all text-slate-400 hover:text-white group w-40"
                      >
                        <svg className="w-12 h-12 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-widest">Active Lens</span>
                      </button>

                      <label className="cursor-pointer flex flex-col items-center gap-3 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/50 transition-all text-slate-400 hover:text-white group w-40 text-center">
                        <svg className="w-12 h-12 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        <span className="text-xs font-bold uppercase tracking-widest">Load Data</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                  </div>
                )}

                {isLoading && isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                     <div className="w-full h-1 bg-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                     <div className="absolute inset-0 bg-amber-500/5 animate-pulse"></div>
                  </div>
                )}

                {(isCameraActive || image) && (
                  <>
                    <div className="absolute inset-0 border-[2px] border-amber-500/20 pointer-events-none m-4">
                      <div className="w-full h-full relative">
                         <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500"></div>
                         <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500"></div>
                         <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500"></div>
                         <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500"></div>
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                            <div className={`w-12 h-12 border border-amber-500/30 rounded-full flex items-center justify-center ${isLoading ? 'animate-ping' : ''}`}>
                               <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                            </div>
                         </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-8 left-8 flex flex-col gap-2">
                      <div className="bg-amber-500 text-black text-[10px] font-bold px-3 py-1 rounded shadow-lg uppercase tracking-widest flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-black ${isCameraActive ? 'animate-pulse' : ''}`}></span>
                        {isCameraActive ? (isAutoScan ? 'AUTO_SCAN_ACTIVE' : 'LIVE_STREAM') : 'STATIC_CAPTURE'}
                      </div>
                      <div className="bg-black/80 backdrop-blur-md text-amber-500 text-[10px] font-bold px-3 py-1 rounded border border-amber-500/30 shadow-lg uppercase tracking-widest text-center">
                        MAG: {zoomLevel.toFixed(2)}x
                      </div>
                    </div>
                  </>
                )}
              </div>

              {(isCameraActive || image) && (
                <div className="absolute bottom-8 left-0 right-0 px-8 flex flex-col gap-4">
                  <div className="bg-black/90 backdrop-blur-2xl p-5 rounded-3xl border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between text-[10px] font-black text-amber-500/70 uppercase tracking-widest px-1">
                        <span>Magnification Control</span>
                        <span className="text-amber-500">{zoomLevel.toFixed(2)}x</span>
                      </div>
                      
                      <div className="flex items-center gap-5">
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
                          {[1, 2, 4].map(val => (
                            <button
                              key={val}
                              onClick={() => setZoomLevel(val)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                Math.abs(zoomLevel - val) < 0.05 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {val}x
                            </button>
                          ))}
                        </div>

                        <div className="flex-1 flex items-center gap-3">
                          <button 
                            onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 rounded-full transition-all border border-amber-500/20"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                            </svg>
                          </button>
                          
                          <div className="relative flex-1 group py-2">
                            <input 
                              type="range" 
                              min="1" 
                              max="4" 
                              step="0.01" 
                              value={zoomLevel} 
                              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                              className="w-full accent-amber-500 h-2 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                            />
                          </div>

                          <button 
                            onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.1))}
                            className="w-8 h-8 flex items-center justify-center text-amber-500 hover:bg-amber-500/10 rounded-full transition-all border border-amber-500/20"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex flex-col gap-4">
              {isCameraActive ? (
                <>
                  <div className="flex gap-4">
                    <button
                      onClick={stopCamera}
                      className="flex-1 py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => setIsAutoScan(!isAutoScan)}
                      className={`flex-1 py-4 px-6 border rounded-2xl font-bold transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 ${
                        isAutoScan 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAutoScan ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`}></span>
                      Auto-Scan
                    </button>
                  </div>
                  <div className="flex gap-4">
                     <button
                      onClick={() => analyzeCurrentFrame()}
                      disabled={isLoading}
                      className="flex-[2] py-5 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-2xl font-bold transition-all shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-3 group"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isLoading ? 'animate-spin' : 'group-hover:rotate-12'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {isLoading ? 'Neural Pulse Active...' : 'Live Neural Pulse'}
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="flex-1 py-5 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all text-xs uppercase tracking-widest"
                    >
                      Freeze
                    </button>
                  </div>
                </>
              ) : image ? (
                <div className="flex flex-col w-full gap-4">
                  <div className="flex gap-4 w-full">
                    <button
                      onClick={() => { setImage(null); setZoomLevel(1); setAnalysis(null); }}
                      className="flex-1 py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest"
                    >
                      Clear Data
                    </button>
                    <button
                      onClick={saveImage}
                      className="flex-1 py-4 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-amber-500 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Save Image
                    </button>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={isLoading}
                    className="w-full py-5 px-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black rounded-2xl font-bold transition-all shadow-xl shadow-amber-500/20 text-xs uppercase tracking-widest"
                  >
                    {isLoading ? 'Decrypting Neural Links...' : 'Initiate Deep Analysis'}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl bg-white/5 border border-white/10 p-8 min-h-[400px] flex-1 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${isLoading ? 'bg-amber-500 animate-ping' : 'bg-slate-700'}`}></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Analysis Feed v4.2</span>
                </div>
                {analysis && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(analysis);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-amber-500 hover:bg-white/10 transition-all"
                    title="Export Analysis"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1m-7-14l4 4m0 0l4-4m-4 4V3" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex-1 relative">
                {analysis ? (
                  <div className="prose prose-invert prose-amber max-w-none animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="text-slate-200 leading-relaxed font-light text-lg border-l-2 border-amber-500/40 pl-8 py-4 bg-amber-500/5 rounded-r-3xl">
                      {analysis}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-20">
                    <div className="w-24 h-24 border-2 border-slate-500/30 rounded-full flex items-center justify-center animate-[pulse_4s_infinite]">
                       <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em]">System Standby: Send Visual Signal</p>
                  </div>
                )}
              </div>
              
              {isLoading && (
                <div className="mt-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-4 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Processing Neural Blocks</span>
                    </div>
                    <span className="text-[9px] font-mono text-amber-500/60">EST_REMAINING: 2.4s</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                     <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 w-1/2 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: #f59e0b;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
          border: 4px solid #000;
          transition: transform 0.1s ease-in-out, box-shadow 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.7);
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  );
};

export default NightVision;
