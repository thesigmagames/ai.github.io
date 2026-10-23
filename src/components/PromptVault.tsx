import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Film,
  Code2,
  Rocket,
  Brain,
  Palette,
  Copy,
  Check,
  Send,
  Search,
  Bookmark
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  prompt: string;
  tags: string[];
}

const TEMPLATES: PromptTemplate[] = [
  // 🎮 Oyun Geliştirme & Mekanikler
  {
    id: 'game-1',
    category: 'games',
    title: 'Roguelike Çekirdek Oynanış Döngüsü',
    prompt: 'The Sigma Games için yenilikçi bir roguelike oyununun çekirdek döngüsünü (core gameplay loop), kalıcı ilerleme (meta-progression) mekaniklerini ve oyuncuyu sürekli ekrana bağlayacak risk-ödül dengesini detaylı bir tablo halinde tasarla.',
    tags: ['Roguelike', 'Oyun Tasarımı', 'Mekanikler']
  },
  {
    id: 'game-2',
    category: 'games',
    title: 'Çok Aşamalı Cyberpunk Boss Savaşı',
    prompt: 'Üç aşamalı (Phase 1: Menzilli Hacking, Phase 2: Çevresel Tuzaklar, Phase 3: Çılgın Yakın Dövüş) bir cyberpunk robotik boss savaşının senaryosunu, saldırı modellerini ve zayıf noktalarını adım adım açıkla.',
    tags: ['Boss Fight', 'Cyberpunk', 'Level Design']
  },
  {
    id: 'game-3',
    category: 'games',
    title: 'Dallanan RPG Diyalog Ağacı',
    prompt: 'Gizemli bir sibernetik tüccarla oyuncu arasında geçen, oyuncunun karizmasına veya önceki seçimlerine göre 4 farklı sona ve gizli bir göreve bağlanan dallanan bir JSON diyalog ağacı tasarla.',
    tags: ['RPG', 'Diyalog', 'Hikaye']
  },
  {
    id: 'game-4',
    category: 'games',
    title: 'HTML5 Mini Canvas Uzay Savaşı Oyunu',
    prompt: 'HTML5 Canvas ve JavaScript ile tek bir dosyada çalışan, ok tuşlarıyla yönlendirilen, uzay gemisiyle asteroidleri vurduğumuz ses efektli eğlenceli bir tıklama oyunu kodu yaz.',
    tags: ['Mini Oyun', 'Canvas', 'JavaScript']
  },

  // 🎬 Sinema & Video
  {
    id: 'video-1',
    category: 'video',
    title: 'ARRI 70mm Sinematik Açılış Çekimi',
    prompt: 'A towering cyberpunk megacity bathed in perpetual neon rain, massive holographic billboards reflecting on wet asphalt, an ultra-smooth cinematic 35mm lens tracking shot pushing forward toward a shadowy lone ronin, 8k resolution, volumetric lighting, shot on ARRI Alexa 65.',
    tags: ['Sinematik', 'ARRI 65', 'Kamera']
  },
  {
    id: 'video-2',
    category: 'video',
    title: 'Epik Bilim Kurgu Teaser Senaryosu',
    prompt: 'Güneşin beklenmedik şekilde kararmaya başladığı bir gelecekte geçen, tüyleri diken diken eden 60 saniyelik bir bilim kurgu teaser fragman senaryosu yaz. Kamera açılarını, müzik yükselişlerini ve son vuruş cümlesini belirt.',
    tags: ['Senaryo', 'Fragman', 'Bilim Kurgu']
  },
  {
    id: 'video-3',
    category: 'video',
    title: 'Yüksek Hızlı FPV Drone Takip Sahnesi',
    prompt: 'High-speed FPV drone dive soaring through deep canyons of an alien crystalline world, centrifugal momentum, banking through neon energy rings, glowing flora, hyper-smooth 60fps dynamic motion blur.',
    tags: ['FPV Drone', 'Aksiyon', 'Hızlı Kamera']
  },

  // 💻 Yazılım & Mimari
  {
    id: 'code-1',
    category: 'code',
    title: 'Ultra Hızlı Dağıtık Mimari Planı',
    prompt: 'Milyonlarca anlık kullanıcıya hizmet veren bir gerçek zamanlı multiplayer oyun altyapısı için WebSockets, Redis Pub/Sub, Node.js microservices ve PostgreSQL veri modelini içeren eksiksiz bir sistem mimarisi şeması ve kod iskeleti hazırla.',
    tags: ['Sistem Mimarisi', 'Microservices', 'WebSockets']
  },
  {
    id: 'code-2',
    category: 'code',
    title: 'Clean Architecture & TypeScript Kalıpları',
    prompt: 'Modern bir React & Node.js projesinde Clean Architecture, Dependency Injection ve Repository Pattern nasıl kurulmalıdır? Klasör hiyerarşisi ve somut TypeScript kod örnekleriyle detaylandır.',
    tags: ['Clean Architecture', 'TypeScript', 'Best Practices']
  },
  {
    id: 'code-3',
    category: 'code',
    title: 'Performans Optimizasyonu & Memory Leak Avı',
    prompt: 'Büyük ölçekli SPA web uygulamalarında bellek sızıntılarını (memory leaks), gereksiz render döngülerini ve render-blocking assetleri tespit edip ortadan kaldırmak için en etkili 10 altın kuralı açıkla.',
    tags: ['Optimizasyon', 'React', 'Performans']
  },

  // 🚀 Girişimcilik & Startup
  {
    id: 'startup-1',
    category: 'startup',
    title: 'Y Combinator Tarzı 10 Slaytlık Pitch Deck',
    prompt: 'Yapay zeka destekli yeni nesil bir oyun stüdyosu girişimi için Silicon Valley yatırımcılarının hayran kalacağı 10 slaytlık vurucu bir Pitch Deck metni ve veri sunumu hazırla.',
    tags: ['Pitch Deck', 'Yatırım', 'Girişimcilik']
  },
  {
    id: 'startup-2',
    category: 'startup',
    title: 'Viral Sosyal Medya Büyüme Stratejisi',
    prompt: 'Sıfır bütçeyle 30 gün içinde TikTok, YouTube Shorts ve X platformlarında 100.000 organik takipçiye ve erken erişim oyuncu listesine ulaşmak için haftalık içerik takvimi ve kanca (hook) cümleleri üret.',
    tags: ['Büyüme', 'Viral', 'TikTok']
  },

  // 🧠 Felsefe & Derin Düşünce
  {
    id: 'phil-1',
    category: 'philosophy',
    title: 'Fermi Paradoksu & Büyük Filtre Analizi',
    prompt: 'Fermi Paradoksu (Bütün uzaylılar nerede?) karşısında "Büyük Filtre" hipotezini, insanlığın bu filtreyi geçip geçmediğini ve gelecekteki olası varoluşsal riskleri derin ve felsefi bir dille analiz et.',
    tags: ['Fermi Paradoksu', 'Felsefe', 'Kozmoloji']
  },
  {
    id: 'phil-2',
    category: 'philosophy',
    title: 'Simülasyon Teorisi ve Kuantum Mekaniği',
    prompt: 'Kuantum çift yarık deneyi, ışık hızının evrensel maksimum sınır olması ve Planck mesafesi gibi fiziksel sınırların, evrenin bir hesaplama matrisi olduğu hipotezini nasıl desteklediğini derinlemesine tartış.',
    tags: ['Simülasyon', 'Kuantum', 'Fizik']
  }
];

export const PromptVault: React.FC<{
  onSendToChat?: (text: string) => void;
  onSendToImage?: (text: string) => void;
}> = ({ onSendToChat, onSendToImage }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Tümü (Hepsi)', icon: Sparkles },
    { id: 'games', label: '🎮 Oyun Geliştirme', icon: Gamepad2 },
    { id: 'video', label: '🎬 Sinema & Video', icon: Film },
    { id: 'code', label: '💻 Yazılım & Mimari', icon: Code2 },
    { id: 'startup', label: '🚀 Girişim & Büyüme', icon: Rocket },
    { id: 'philosophy', label: '🧠 Felsefe & Derin Zeka', icon: Brain }
  ];

  const filtered = TEMPLATES.filter((t) => {
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d18] overflow-y-auto text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-violet-950/30 to-slate-900 border border-cyan-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              MEGA İSTEM VE ŞABLON HAZİNESİ
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-sans border border-cyan-500/30">
                PROMPT VAULT
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Tek tıkla sohbete aktarabileceğiniz, oyun tasarımı, sinematik video, yazılım mimarisi ve felsefe şablonları.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Şablonlarda ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-violet-600 border-cyan-400 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {item.category.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed font-sans">
                {item.prompt}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(item.id, item.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 flex items-center gap-1 transition-colors"
                >
                  {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === item.id ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>

                <div className="flex items-center gap-1">
                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => onSendToChat(item.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                      title="Sohbete Gönder"
                    >
                      <Send className="w-3 h-3" />
                      <span>Sohbete At</span>
                    </button>
                  )}

                  {onSendToImage && (item.category === 'video' || item.category === 'games') && (
                    <button
                      type="button"
                      onClick={() => onSendToImage(item.prompt)}
                      className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all"
                      title="Görsel Stüdyosuna Aktar"
                    >
                      <Palette className="w-3 h-3" />
                      <span>Görsele At</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
