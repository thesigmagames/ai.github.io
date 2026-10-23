import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Camera,
  Sparkles,
  Layers,
  Sliders,
  Copy,
  Check,
  Download,
  Trash2,
  Upload,
  Eye,
  Activity,
  Palette,
  Maximize2,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  FileText
} from 'lucide-react';

export interface VideoAnalysisResult {
  summary: string;
  cinematography: {
    shotType: string;
    cameraMotion: string;
    composition: string;
    framing: string;
  };
  lighting: {
    style: string;
    colorTemperature: string;
    contrastRatio: string;
    dominantPalette: string[];
  };
  objectsAndAtmosphere: {
    detectedSubjects: string[];
    mood: string;
    atmosphere: string;
  };
  scores: {
    overall: number;
    cinematography: number;
    lighting: number;
    atmosphere: number;
    coherence: number;
  };
  reversePrompt: string;
  directorCritique: string;
  audioSuggestion: string;
}

export interface KeyframeCapture {
  id: string;
  timestamp: number;
  dataUrl: string;
  frameNumber: number;
}

interface VideoInspectorProps {
  initialVideoUrl?: string;
  initialTitle?: string;
  onSendToImage?: (prompt: string) => void;
  onSendToChat?: (text: string) => void;
}

const SAMPLE_PRESETS = [
  {
    id: 'cyberpunk',
    title: '🌆 Cyberpunk Neo-Tokyo',
    desc: 'Neon yansımalar ve sibernetik VFX',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 'space_cgi',
    title: '🌌 Derin Uzay & CGI Makine',
    desc: 'Holografik kontrol paneli ve 3D derinlik',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 'cinematic_fantasy',
    title: '🎬 Sintel Sinematik Epik',
    desc: 'Doğal ışıklandırma ve karakter odaklı aksiyon',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 'nature_drone',
    title: '🏔️ FPV Doğa & Dağ Yolu',
    desc: 'Geniş manzara açısı ve atmosferik sis',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4'
  },
  {
    id: 'fast_chase',
    title: '🏎️ Bullrun Yüksek Hızlı Takip',
    desc: 'Dinamik kamera sarsıntısı ve hareket bulanıklığı',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  }
];

export const VideoInspector: React.FC<VideoInspectorProps> = ({
  initialVideoUrl,
  initialTitle,
  onSendToVideoStudio,
  onSendToChat
}) => {
  const [videoSrc, setVideoSrc] = useState<string>(
    initialVideoUrl || SAMPLE_PRESETS[0].url
  );
  const [videoTitle, setVideoTitle] = useState<string>(
    initialTitle || SAMPLE_PRESETS[0].title
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  // Keyframes
  const [capturedKeyframes, setCapturedKeyframes] = useState<KeyframeCapture[]>([]);
  const [selectedKeyframe, setSelectedKeyframe] = useState<KeyframeCapture | null>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep track of metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setDuration(video.duration || 10);
    };
    const onEnded = () => {
      if (!isLooping) setIsPlaying(false);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('ended', onEnded);
    };
  }, [videoSrc, isLooping]);

  // Load cached analysis from localStorage if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sigma_last_video_inspection');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.scores) {
          setAnalysisResult(parsed);
        }
      }
    } catch {}
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (newTime: number) => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = Math.max(0, Math.min(newTime, duration));
      setCurrentTime(v.currentTime);
    }
  };

  const handleFrameStep = (frames: number) => {
    const v = videoRef.current;
    if (!v) return;
    const frameRate = 30; // standard estimate
    const newTime = v.currentTime + frames * (1 / frameRate);
    handleSeek(newTime);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Upload Custom Video
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
    setCapturedKeyframes([]);
    setAnalysisResult(null);
    setIsPlaying(false);
  };

  // Capture Current Frame
  const handleCaptureFrame = (): KeyframeCapture | null => {
    const video = videoRef.current;
    if (!video) return null;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

      const frameNumber = Math.floor(video.currentTime * 30);
      const capture: KeyframeCapture = {
        id: `frame_${Date.now()}_${frameNumber}`,
        timestamp: video.currentTime,
        dataUrl,
        frameNumber
      };

      setCapturedKeyframes((prev) => [capture, ...prev.slice(0, 15)]);
      setSelectedKeyframe(capture);
      return capture;
    } catch (e) {
      console.warn('Frame capture error (CORS might restrict cross-origin image extraction):', e);
      return null;
    }
  };

  // Trigger AI Video Inspection
  const handleInspectVideo = async () => {
    setIsAnalyzing(true);

    // Capture current frame if not already selected
    let targetFrame = selectedKeyframe;
    if (!targetFrame) {
      targetFrame = handleCaptureFrame();
    }

    try {
      const res = await fetch('/api/analyze-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameImage: targetFrame ? targetFrame.dataUrl : '',
          timestamp: currentTime,
          duration: duration,
          videoTitle: videoTitle
        })
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
        try {
          localStorage.setItem('sigma_last_video_inspection', JSON.stringify(data.analysis));
        } catch {}
      } else {
        alert(data.error || 'Video inceleme tamamlanamadı.');
      }
    } catch (e: any) {
      alert('İnceleme isteği başarısız: ' + e?.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!analysisResult?.reversePrompt) return;
    navigator.clipboard.writeText(analysisResult.reversePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
  };

  const handleClearAnalysis = () => {
    setAnalysisResult(null);
    setCapturedKeyframes([]);
    localStorage.removeItem('sigma_last_video_inspection');
  };

  // Formatting timecode
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d1a] overflow-y-auto text-slate-100 p-4 sm:p-6 space-y-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-violet-950/30 to-slate-900 border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              SIGMA VİDEO İNCELEME & ANALİZ STÜDYOSU
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-sans border border-cyan-500/30">
                AI MULTIMODAL INSPECTOR
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            İstediğiniz videoyu yükleyin veya seçin. Kare kare inceleyin, sinematografi, ışıklandırma, renk paleti ve tersine mühendislik prompt analizi yapın.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Kendi Videonu Yükle</span>
          </button>

          {analysisResult && (
            <button
              type="button"
              onClick={handleClearAnalysis}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="Analizi ve kareleri temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Select */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hazır Sinematik Video Örnekleri (Tek Tıkla İncele):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SAMPLE_PRESETS.map((preset) => {
            const isSelected = videoSrc === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setVideoSrc(preset.url);
                  setVideoTitle(preset.title);
                  setCapturedKeyframes([]);
                  setAnalysisResult(null);
                  setIsPlaying(false);
                }}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/50 border-cyan-500 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="text-xs font-bold truncate">{preset.title}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Video Player & Frame Timeline | Right: AI Analysis Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Video Viewport & Frame Timeline (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
            {/* Viewport Header */}
            <div className="p-3 px-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white truncate max-w-sm">
                  {videoTitle}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300">
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {formatTimecode(currentTime)} / {formatTimecode(duration)}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  Kare #{Math.floor(currentTime * 30)}
                </span>
              </div>
            </div>

            {/* Video Viewport */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={videoSrc}
                playsInline
                loop={isLooping}
                muted={isMuted}
                crossOrigin="anonymous"
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Watermark / Status Badge */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 pointer-events-none">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>AI FRAME INSPECTOR</span>
                <span className="text-slate-500">•</span>
                <span>{playbackSpeed}x</span>
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20">
                  <RotateCcw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="text-sm font-bold text-white font-mono">
                    GEMINI YAPAY ZEKA VİDEOYU İNCELİYOR...
                  </div>
                  <div className="text-xs text-slate-400">
                    Kare kompozisyonu, ışıklandırma, renk profili ve prompt çıkarılıyor...
                  </div>
                </div>
              )}
            </div>

            {/* Scrubber & Video Controls */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 space-y-3">
              {/* Timeline Slider */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 w-14 text-right">
                  {formatTimecode(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 10}
                  step={0.033}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[10px] font-mono text-slate-400 w-14">
                  {formatTimecode(duration)}
                </span>
              </div>

              {/* Bottom Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Playback Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSeek(0)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Başa Dön"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFrameStep(-1)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="1 Kare Geri (-1 frame / 0.033s)"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
                    title={isPlaying ? 'Durdur' : 'Oynat'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFrameStep(1)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="1 Kare İleri (+1 frame / 0.033s)"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>

                {/* Speed Selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[0.25, 0.5, 1, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        playbackSpeed === s
                          ? 'bg-cyan-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                {/* Frame Capture Action */}
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="px-3 py-1.5 rounded-xl bg-violet-950/60 hover:bg-violet-900/70 border border-violet-500/50 text-violet-300 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Kare Yakala</span>
                </button>
              </div>
            </div>
          </div>

          {/* Captured Keyframes Strip */}
          {capturedKeyframes.length > 0 && (
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-violet-400" />
                  <span>Yakalanan Kareler ({capturedKeyframes.length})</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Bir kareye tıklayarak o ana gidebilir veya analiz edebilirsiniz
                </span>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {capturedKeyframes.map((kf) => (
                  <div
                    key={kf.id}
                    onClick={() => {
                      handleSeek(kf.timestamp);
                      setSelectedKeyframe(kf);
                    }}
                    className={`relative shrink-0 w-28 aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedKeyframe?.id === kf.id
                        ? 'border-cyan-400 ring-2 ring-cyan-500/40 scale-102'
                        : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={kf.dataUrl} alt="keyframe" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/80 px-1 py-0.5 text-[9px] font-mono text-cyan-300 flex justify-between">
                      <span>{kf.timestamp.toFixed(1)}s</span>
                      <span>#{kf.frameNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Big Action: Run AI Inspection */}
          <button
            type="button"
            onClick={handleInspectVideo}
            disabled={isAnalyzing}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-600/30 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>Yapay Zeka Video Sahnesini İnceliyor...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span>Mevcut Video Karesini Yapay Zeka ile İncele (Gemini Video AI)</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Video Inspection Findings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
              {/* Overall Quality Score Cards */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sinematik Kalite & Puanlama</span>
                  </div>
                  <div className="text-base font-black font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/40">
                    {analysisResult.scores.overall}/100
                  </div>
                </div>

                {/* Score Progress Bars */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Sinematografi</span>
                      <span className="font-mono text-cyan-300 font-bold">{analysisResult.scores.cinematography}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${analysisResult.scores.cinematography}%` }} />
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Işık & Renk</span>
                      <span className="font-mono text-violet-300 font-bold">{analysisResult.scores.lighting}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${analysisResult.scores.lighting}%` }} />
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Atmosfer</span>
                      <span className="font-mono text-pink-300 font-bold">{analysisResult.scores.atmosphere}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-400 rounded-full" style={{ width: `${analysisResult.scores.atmosphere}%` }} />
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Hareket Dengesi</span>
                      <span className="font-mono text-emerald-300 font-bold">{analysisResult.scores.coherence}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${analysisResult.scores.coherence}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Scene Summary */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sahne ve Hareket Özeti</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Cinematography & Camera Breakdown */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                  <span>Kamera & Çekim Dinamikleri</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Çekim Ölçeği:</span>
                    <span className="text-cyan-300 font-semibold">{analysisResult.cinematography.shotType}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Kamera Hareketi:</span>
                    <span className="text-violet-300 font-semibold">{analysisResult.cinematography.cameraMotion}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Kompozisyon:</span>
                    <span className="text-slate-200">{analysisResult.cinematography.composition}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Kadraj & DoF:</span>
                    <span className="text-slate-200">{analysisResult.cinematography.framing}</span>
                  </div>
                </div>
              </div>

              {/* Lighting & Dominant Color Palette */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-pink-400" />
                    <span>Işıklandırma & Baskın Renk Paleti</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Kopyalamak için renge tıkla</span>
                </div>

                <div className="flex items-center gap-2">
                  {analysisResult.lighting.dominantPalette.map((hex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCopyHex(hex)}
                      title={`Kopyala: ${hex}`}
                      className="group/color flex-1 h-10 rounded-xl relative overflow-hidden border border-white/20 transition-all hover:scale-105 cursor-pointer shadow-md"
                      style={{ backgroundColor: hex }}
                    >
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/color:opacity-100 flex items-center justify-center transition-opacity">
                        {copiedHex === hex ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">Stil:</span>
                    <span className="text-slate-200 font-medium truncate block">{analysisResult.lighting.style}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 block text-[10px]">Renk Sıcaklığı:</span>
                    <span className="text-amber-300 font-medium truncate block">{analysisResult.lighting.colorTemperature}</span>
                  </div>
                </div>
              </div>

              {/* Reverse-Engineered Prompt Box */}
              <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 p-4 rounded-2xl border border-violet-500/40 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-violet-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Tersine Mühendislik Promptu (Reverse Prompt)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-2.5 py-1 rounded-lg bg-violet-900/60 hover:bg-violet-800 text-[11px] font-semibold text-violet-200 border border-violet-700/60 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-32 overflow-y-auto">
                  {analysisResult.reversePrompt}
                </div>

                {onSendToImage && (
                  <button
                    type="button"
                    onClick={() => onSendToImage(analysisResult.reversePrompt)}
                    className="w-full py-2 px-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/30 transition-all cursor-pointer"
                  >
                    <span>🎨 Bu Prompt ile Görsel Üret (Görsel Stüdyosu)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Director Critique & Audio Suggestions */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yönetmen Değerlendirmesi</span>
                </div>
                <p className="text-slate-400 italic bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  &quot;{analysisResult.directorCritique}&quot;
                </p>
                <div className="pt-1 text-[11px] text-cyan-300 flex items-start gap-1.5">
                  <span className="font-bold shrink-0">🎵 Müzik Önerisi:</span>
                  <span className="text-slate-400">{analysisResult.audioSuggestion}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                <Eye className="w-8 h-8 opacity-75" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">İnceleme Raporu Bekleniyor</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Sol taraftaki oynatıcıdan bir anı durdurun veya kare yakalayın, ardından &quot;Mevcut Video Karesini Yapay Zeka ile İncele&quot; butonuna basın.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-left text-xs space-y-2 text-slate-400">
                <div className="font-bold text-slate-200">🔍 Video İnceleme Neleri Çıkarır?</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Sinematik kamera manevrası ve lens açısı</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>5 tonlu dominan Hex renk paleti çıkarımı</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Işık stili, renk ısısı ve HDR kontrast tespiti</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Tersine mühendislik ile üretici yapay zeka promptu</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
