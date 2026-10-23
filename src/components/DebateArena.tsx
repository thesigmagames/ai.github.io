import React, { useState, useEffect } from 'react';
import {
  Brain,
  Swords,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  ChevronRight,
  MessageSquare,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react';

interface DebateMessage {
  id: string;
  round: number;
  speaker: string;
  role: 'A' | 'B';
  content: string;
  timestamp: string;
}

interface ArgumentNode {
  id: string;
  type: 'root' | 'pro' | 'con';
  title: string;
  summary: string;
}

const PRESET_TOPICS = [
  'Yapay Zeka (AGI) 2030 yılına kadar insan beynini geride bırakacak mı?',
  'İnsanlığın geleceği: Mars kolonileşmesi mi yoksa Derin Okyanus şehirleri mi?',
  'Video oyunlarında otonom yapay zeka NPC\'leri gerçek oyuncuların yerini alabilir mi?',
  'Simülasyon Argümanı: İçinde yaşadığımız evren bir bilgisayar simülasyonu mu?',
  'Açık Kaynak Yapay Zeka mı yoksa Kapalı Kurumsal Modeller mi kazanacak?'
];

const AGENT_PERSONAS = [
  { id: 'sigma', name: 'Sigma Savunucu', desc: 'Vizyoner, cesur, geleceğe inanan stratejist', color: 'text-cyan-400 border-cyan-500' },
  { id: 'skeptic', name: 'Eleştirel Şüpheci', desc: 'Pragmatik, risk odaklı ve analitik sorgulayıcı', color: 'text-pink-400 border-pink-500' },
  { id: 'philosopher', name: 'Dahi Filozof', desc: 'Varoluşsal, etik ve derin anlam avcısı', color: 'text-violet-400 border-violet-500' },
  { id: 'architect', name: 'Mantık Mimarı', desc: 'Veri, matematik ve mühendislik gerçekçisi', color: 'text-emerald-400 border-emerald-500' }
];

export const DebateArena: React.FC<{ onSendToChat?: (text: string) => void }> = ({ onSendToChat }) => {
  const [topic, setTopic] = useState(PRESET_TOPICS[0]);
  const [agentA, setAgentA] = useState(AGENT_PERSONAS[0].name);
  const [agentB, setAgentB] = useState(AGENT_PERSONAS[1].name);
  const [debateHistory, setDebateHistory] = useState<DebateMessage[]>(() => {
    try {
      const saved = localStorage.getItem('sigma_ai_debate_history_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [isDebating, setIsDebating] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [nodes, setNodes] = useState<ArgumentNode[]>([
    { id: 'root', type: 'root', title: 'Ana Münazara Tezi', summary: PRESET_TOPICS[0] }
  ]);
  const [showClearModal, setShowClearModal] = useState(false);

  // Save debate history
  useEffect(() => {
    try {
      localStorage.setItem('sigma_ai_debate_history_v1', JSON.stringify(debateHistory));
    } catch {}
  }, [debateHistory]);

  const handleNextDebateTurn = async () => {
    if (!topic.trim()) return;

    setIsDebating(true);
    const activeRole: 'A' | 'B' = debateHistory.length % 2 === 0 ? 'A' : 'B';
    const roundNumber = Math.floor(debateHistory.length / 2) + 1;

    try {
      const res = await fetch('/api/debate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          personaA: agentA,
          personaB: agentB,
          activeAgent: activeRole,
          round: roundNumber,
          history: debateHistory.map((d) => ({ speaker: d.speaker, text: d.content }))
        })
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const newMsg: DebateMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          round: roundNumber,
          speaker: data.speaker,
          role: activeRole,
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setDebateHistory((prev) => [...prev, newMsg]);

        // Add to visual argument node tree
        const nodeTitle = data.reply.split('\n')[0].replace(/[*#]/g, '').trim().slice(0, 45) || `${data.speaker} Argümanı`;
        setNodes((prev) => [
          ...prev,
          {
            id: `node_${Date.now()}`,
            type: activeRole === 'A' ? 'pro' : 'con',
            title: nodeTitle,
            summary: data.reply.slice(0, 90) + '...'
          }
        ]);
        setCurrentRound(roundNumber);
      }
    } catch (e: any) {
      alert('Münazara adımı hatası: ' + e?.message);
    } finally {
      setIsDebating(false);
    }
  };

  // Delete single argument turn
  const handleDeleteRound = (id: string) => {
    setDebateHistory((prev) => prev.filter((d) => d.id !== id));
  };

  // Reset & Clear current debate
  const handleResetDebate = () => {
    setDebateHistory([]);
    setCurrentRound(1);
    setNodes([{ id: 'root', type: 'root', title: 'Ana Münazara Tezi', summary: topic }]);
    localStorage.removeItem('sigma_ai_debate_history_v1');
    setShowClearModal(false);
  };

  // Export debate
  const handleExportDebate = () => {
    const text = `# ${topic}\n\nMünazaracılar: ${agentA} vs ${agentB}\n\n` +
      debateHistory.map((d) => `### Tur ${d.round} - ${d.speaker} (${d.timestamp})\n\n${d.content}\n`).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigma_munazara_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d18] overflow-y-auto text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-pink-950/30 to-slate-900 border border-violet-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 text-white shadow-lg shadow-violet-500/30">
              <Swords className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              ÇOKLU AJAN MÜNAZARA ARENASI
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-sans border border-violet-500/30">
                MULTI-AGENT INTELLECT
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Farklı yapay zeka ajanlarını karşı karşıya getirin, karşılıklı savlarını izleyin, turları silin veya sıfırlayın.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {debateHistory.length > 0 && (
            <button
              type="button"
              onClick={handleExportDebate}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Münazarayı İndir"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dışa Aktar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowClearModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 border border-rose-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Münazarayı Sıfırla ve Tüm Kayıtları Sil"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Münazarayı Temizle</span>
          </button>
        </div>
      </div>

      {/* Setup Panel: Topic & Personas */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Münazara Başlığı & Sorusu</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setNodes([{ id: 'root', type: 'root', title: 'Ana Münazara Tezi', summary: e.target.value }]);
              }}
              placeholder="Tartışılacak konuyu yazın..."
              className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-violet-500 text-xs sm:text-sm text-slate-100 placeholder-slate-500"
            />
          </div>

          {/* Quick Preset Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
            {PRESET_TOPICS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTopic(preset);
                  setNodes([{ id: 'root', type: 'root', title: 'Ana Münazara Tezi', summary: preset }]);
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-700/40 transition-all shrink-0 cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dual Agent Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Agent A */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="text-xs font-bold text-cyan-400 flex items-center justify-between">
              <span>🔵 1. AJAN (TEZ SAVUNUCUSU)</span>
            </div>
            <select
              value={agentA}
              onChange={(e) => setAgentA(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-cyan-800/60 text-xs text-cyan-200 focus:outline-none"
            >
              {AGENT_PERSONAS.map((p) => (
                <option key={p.id} value={p.name}>{p.name} - {p.desc}</option>
              ))}
            </select>
          </div>

          {/* Agent B */}
          <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-2">
            <div className="text-xs font-bold text-pink-400 flex items-center justify-between">
              <span>🔴 2. AJAN (ANTİTEZ ELEŞTİRMENİ)</span>
            </div>
            <select
              value={agentB}
              onChange={(e) => setAgentB(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-pink-800/60 text-xs text-pink-200 focus:outline-none"
            >
              {AGENT_PERSONAS.map((p) => (
                <option key={p.id} value={p.name}>{p.name} - {p.desc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Turn Button */}
        <button
          type="button"
          onClick={handleNextDebateTurn}
          disabled={isDebating}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isDebating ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin text-cyan-300" />
              <span>Ajan Argüman Üretiyor... (Derin Analiz)</span>
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              <span>
                {debateHistory.length === 0
                  ? 'Münazarayı Başlat (1. Tur)'
                  : `Sonraki Hamleyi Yap (Tur ${currentRound} - Sıra: ${debateHistory.length % 2 === 0 ? agentA : agentB})`}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Debate Chat Stream (Left) & Visual Argument Mind Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Turn by Turn Debate Stream with individual delete button */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between px-1">
            <span>MÜNAZARA AKIŞI ({debateHistory.length} Hamle)</span>
          </div>

          {debateHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 text-slate-500 text-xs space-y-2">
              <Swords className="w-8 h-8 mx-auto opacity-50 text-violet-400" />
              <p>Münazara henüz başlamadı. Yukarıdaki butona basarak ilk hamleyi başlatın.</p>
            </div>
          ) : (
            debateHistory.map((msg) => {
              const isA = msg.role === 'A';
              return (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition-all group relative ${
                    isA
                      ? 'bg-cyan-950/30 border-cyan-500/40 shadow-sm'
                      : 'bg-pink-950/30 border-pink-500/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                        isA ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      }`}>
                        {msg.speaker}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Tur {msg.round} • {msg.timestamp}</span>
                    </div>

                    {/* Single Round Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteRound(msg.id)}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Bu hamleyi sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Interactive Argument Mind Map Graph */}
        <div className="lg:col-span-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-violet-400" />
              <span>ARGÜMAN ZİHİN HARİTASI (MIND MAP)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{nodes.length} Düğüm</span>
          </div>

          <div className="space-y-2.5">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`p-3 rounded-xl border transition-all ${
                  node.type === 'root'
                    ? 'bg-violet-950/50 border-violet-500/50 text-violet-200'
                    : node.type === 'pro'
                    ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 ml-4'
                    : 'bg-pink-950/40 border-pink-500/40 text-pink-200 ml-4'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {node.type === 'root' ? (
                    <Brain className="w-3.5 h-3.5 text-violet-400" />
                  ) : node.type === 'pro' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-pink-400" />
                  )}
                  <span>{node.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{node.summary}</p>
              </div>
            ))}
          </div>

          {onSendToChat && debateHistory.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const summary = debateHistory.map((m) => `${m.speaker}: ${m.content}`).join('\n\n');
                onSendToChat(`Şu münazarayı incele ve kimin haklı olduğunu tarafsız bir hakem gibi puanla değerlendir:\n\nKonu: ${topic}\n\n${summary}`);
              }}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Hakem Değerlendirmesi İste</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Clear Debate */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-base font-bold text-white">Münazarayı Sıfırlamak İstiyor Musunuz?</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mevcut münazara akışı ve oluşturulan tüm argüman zihin haritası kalıcı olarak silinecektir.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleResetDebate}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Evet, Temizle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
