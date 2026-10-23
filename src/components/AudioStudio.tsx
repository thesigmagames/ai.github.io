import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Sparkles,
  Zap,
  Radio,
  Music,
  Headphones,
  RotateCcw,
  Mic,
  Activity
} from 'lucide-react';

type AmbientPreset = 'cyberpunk' | 'space' | 'lofi' | 'zen';

export const AudioStudio: React.FC = () => {
  const [activePreset, setActivePreset] = useState<AmbientPreset | null>(null);
  const [masterVolume, setMasterVolume] = useState(0.4);
  const [ttsText, setTtsText] = useState('Sigma AI laboratuvarına hoş geldiniz. Tüm yaratıcı sistemler tam kapasite devrede.');
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsRate, setTtsRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSfx, setActiveSfx] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodesRef = useRef<{
    gainNode: GainNode;
    oscillators: OscillatorNode[];
    noiseNode?: AudioNode;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Stop current ambient
  const stopAmbient = () => {
    if (ambientNodesRef.current) {
      try {
        ambientNodesRef.current.gainNode.gain.linearRampToValueAtTime(
          0.001,
          audioCtxRef.current!.currentTime + 0.5
        );
        setTimeout(() => {
          ambientNodesRef.current?.oscillators.forEach((osc) => {
            try { osc.stop(); } catch {}
          });
          ambientNodesRef.current = null;
        }, 600);
      } catch (e) {
        console.warn(e);
      }
    }
    setActivePreset(null);
  };

  // Start chosen synthesized ambient
  const playAmbient = (preset: AmbientPreset) => {
    stopAmbient();
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const oscillators: OscillatorNode[] = [];

    if (preset === 'cyberpunk') {
      // Cyberpunk: Deep 55Hz sub drone + Detuned 110Hz saw + Lowpass filter sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      oscillators.push(lfo);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);
      const g1 = ctx.createGain();
      g1.gain.value = 0.25;
      osc1.connect(g1);
      g1.connect(filter);
      osc1.start();
      oscillators.push(osc1);

      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(110.5, ctx.currentTime);
      const g2 = ctx.createGain();
      g2.gain.value = 0.2;
      osc2.connect(g2);
      g2.connect(filter);
      osc2.start();
      oscillators.push(osc2);

      filter.connect(masterGain);
    } else if (preset === 'space') {
      // Deep Space: 432Hz harmonious sine waves with subtle beating
      const freqs = [108, 216, 432, 648];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + idx * 0.4, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.value = 0.1 / (idx + 1);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscillators.push(osc);
      });
    } else if (preset === 'lofi') {
      // Lo-Fi: Warm triangular chords with tape flutter
      const chord = [130.81, 164.81, 196.00, 246.94]; // C major 7
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.value = 0.08;
        osc.connect(filter);
        filter.connect(g);
        g.connect(masterGain);
        osc.start();
        oscillators.push(osc);
      });
    } else if (preset === 'zen') {
      // Zen Forest: Ethereal pentatonic chimes
      const pentatonic = [220, 247.5, 277.2, 330, 370];
      pentatonic.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        const g = ctx.createGain();
        g.gain.value = 0.06;
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscillators.push(osc);
      });
    }

    ambientNodesRef.current = {
      gainNode: masterGain,
      oscillators
    };
    setActivePreset(preset);
  };

  // Update master volume
  useEffect(() => {
    if (ambientNodesRef.current) {
      ambientNodesRef.current.gainNode.gain.setValueAtTime(
        masterVolume,
        audioCtxRef.current!.currentTime
      );
    }
  }, [masterVolume]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, []);

  // Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const render = () => {
      tick++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 32;
      const w = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        let h = 4;
        if (activePreset || isSpeaking) {
          const factor = activePreset === 'cyberpunk' ? 0.8 : activePreset === 'space' ? 0.5 : 0.6;
          h = Math.sin(tick * 0.08 + i * 0.3) * 25 * factor + 30;
          h = Math.max(4, h);
        }

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;

        ctx.fillRect(i * w + 1, canvas.height - h, w - 2, h);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activePreset, isSpeaking]);

  // Synthesize SFX on the fly using Web Audio API
  const playSfx = (type: string) => {
    const ctx = getAudioContext();
    setActiveSfx(type);
    setTimeout(() => setActiveSfx(null), 400);

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'braam') {
      // Cinematic Inception Braam
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 1.2);
      gain.gain.setValueAtTime(0.5 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'laser') {
      // Retro Laser
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
      gain.gain.setValueAtTime(0.4 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'glitch') {
      // Cyber Glitch
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.05);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.3 * masterVolume, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'warp') {
      // Sci-Fi Warp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.6);
      gain.gain.setValueAtTime(0.35 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'victory') {
      // Victory Chime Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.1);
        g.gain.setValueAtTime(0.3 * masterVolume, now + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(now + idx * 0.1);
        o.stop(now + idx * 0.1 + 0.4);
      });
    }
  };

  // Text-To-Speech
  const handleSpeakTts = () => {
    if (!('speechSynthesis' in window)) {
      alert('Tarayıcınız ses sentezini desteklemiyor.');
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;
    utterance.lang = 'tr-TR';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const presets = [
    {
      id: 'cyberpunk' as AmbientPreset,
      name: 'Siberpunk Şehir',
      desc: 'Derin analog sub bas, neon dronlar ve yağmur fısıltısı',
      color: 'from-violet-600 to-indigo-800'
    },
    {
      id: 'space' as AmbientPreset,
      name: 'Derin Kozmos',
      desc: '432Hz kozmik frekans, yıldız rüzgarları ve yerçekimsiz dalgalar',
      color: 'from-blue-600 to-cyan-800'
    },
    {
      id: 'lofi' as AmbientPreset,
      name: 'Lo-Fi Kafe Yağmuru',
      desc: 'Sıcak analog kaset dokusu ve yumuşak melankolik akorlar',
      color: 'from-amber-600 to-orange-800'
    },
    {
      id: 'zen' as AmbientPreset,
      name: 'Zen Ormanı',
      desc: 'Dingin rüzgar çanları, dağ pınarı ve zihinsel odaklanma',
      color: 'from-emerald-600 to-teal-800'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d18] overflow-y-auto text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              SIGMA AUDIO & SOUNDSCAPE
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-sans border border-cyan-500/30">
                SYNTHESIZER
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Sıfır kota bağımlılığı, gerçek zamanlı Web Audio sentezleyicisi, ortam ambiyansları, SFX ses tahtası ve TTS ses laboratuvarı.
          </p>
        </div>

        {/* Visualizer Canvas */}
        <div className="bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <canvas ref={canvasRef} width={120} height={32} className="w-28 h-8 rounded" />
        </div>
      </div>

      {/* Grid: Ambient Presets & SFX Soundboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Real-time Ambient Soundscapes */}
        <div className="lg:col-span-7 space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>SENTETİK AMBİYANS AKIŞLARI (SYNTHESIZED SOUNDSCAPES)</span>
            </div>

            {/* Master Volume Slider */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-400 w-7">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => (isActive ? stopAmbient() : playAmbient(p.id))}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-slate-900 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <button
                      type="button"
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {activePreset && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between">
              <div className="text-xs text-cyan-300 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Şu an çalıyor: <strong>{presets.find((p) => p.id === activePreset)?.name}</strong></span>
              </div>
              <button
                type="button"
                onClick={stopAmbient}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
              >
                Ambiyansı Durdur
              </button>
            </div>
          )}
        </div>

        {/* Right: Instant SFX Soundboard */}
        <div className="lg:col-span-5 space-y-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span>SİNEMATİK SFX SES TAHTASI (INSTANT SFX BOARD)</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'braam', label: '💥 Sinematik Braam', desc: 'Inception Sub-Drop' },
              { id: 'laser', label: '🔫 Lazer Atışı', desc: 'Retro Arcade Zap' },
              { id: 'glitch', label: '⚡ Siber Glitch', desc: 'FM Sentez Paraziti' },
              { id: 'warp', label: '🛸 Işınlanma', desc: 'Sci-Fi Warp Drive' },
              { id: 'victory', label: '🏆 Zafer Arpeji', desc: 'Majör Chime Dizilimi' }
            ].map((sfx) => {
              const isPlayingSfx = activeSfx === sfx.id;
              return (
                <button
                  key={sfx.id}
                  type="button"
                  onClick={() => playSfx(sfx.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isPlayingSfx
                      ? 'bg-violet-600 border-violet-400 text-white scale-98 shadow-md shadow-violet-500/30'
                      : 'bg-slate-950/70 border-slate-800 hover:border-violet-500/50 text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{sfx.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{sfx.desc}</div>
                </button>
              );
            })}
          </div>

          {/* Text to Speech Voice Synthesizer */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>SESLENDİRME & TTS SES MOTORU</span>
            </div>

            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:outline-none text-xs text-slate-200 resize-none"
            />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Ton (Pitch): {ttsPitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  value={ttsPitch}
                  onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Hız (Rate): {ttsRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.1"
                  value={ttsRate}
                  onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpeakTts}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Seslendirmeyi Durdur</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Metni Seslendir (AI Voice)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
