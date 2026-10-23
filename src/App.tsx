/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Code2,
  BookOpen,
  Send,
  Trash2,
  Copy,
  Check,
  Brain,
  Globe,
  Server,
  Zap,
  Gamepad2,
  AlertTriangle,
  RefreshCw,
  User,
  ShieldCheck,
  ChevronRight,
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Paperclip,
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Download,
  Edit2,
  Search,
  RotateCcw,
  Menu,
  ChevronLeft,
  ExternalLink,
  Flame,
  Wand2,
  Maximize2,
  Eye,
  FileCode,
  Bookmark,
  BookmarkCheck,
  Share2,
  Compass,
  Sliders,
  ChevronDown,
  Layers,
  FileText,
  Film,
  Radio,
  Swords
} from 'lucide-react';
import { VideoInspector } from './components/VideoInspector';
import { AudioStudio } from './components/AudioStudio';
import { CodeSandbox } from './components/CodeSandbox';
import { DebateArena } from './components/DebateArena';
import { PromptVault } from './components/PromptVault';
import { ThreeGameStudio } from './components/ThreeGameStudio';

export type AppTab = 'chat' | 'image' | 'video-inspect' | 'audio' | 'sandbox' | 'debate' | 'vault' | 'game3d';
type Persona = 'general' | 'coder' | 'writer' | 'tutor' | 'grok' | 'artist';
type Language = 'tr' | 'en' | 'de' | 'es';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3';
type ImageStyle = 'cyberpunk' | 'photo' | 'anime' | '3d' | 'fantasy';

interface AttachedImage {
  data: string; // base64
  mimeType: string;
  name: string;
  size: number;
}

interface GroundingSource {
  title: string;
  url: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  originalPrompt?: string;
  model?: string;
  aspectRatio?: string;
  timestamp?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  image?: AttachedImage;
  generatedImage?: GeneratedImage;
  sources?: GroundingSource[];
  deepThinking?: boolean;
  webSearch?: boolean;
  latencyMs?: number;
  isPinned?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  persona: Persona;
  language: Language;
  messages: ChatMessage[];
}

interface ServerStatus {
  configured: boolean;
  keyPreview: string | null;
  formatValid: boolean;
  isValidOnGoogle?: boolean;
  googleErrorReason?: string | null;
  instructions?: string;
}

const UI_TEXT = {
  tr: {
    title: 'Sigma AI',
    subtitle: 'The Sigma Games Yapay Zeka Laboratuvarı',
    welcome: 'Selam! Ben The Sigma Games tarafından geliştirilen **Sigma AI**.\n\nGörsel üretimi, canlı web araması, kodlama mimarisi, oyun tasarımı ve derin düşünce için emrindeyim.\n\nSoru sorabilir, fotoğraf yükleyebilir, **Görsel Üret** moduna geçebilir veya sol panelden uzmanlık modunu değiştirebilirsin.',
    placeholder: 'Sigma AI\'a bir mesaj yaz, görsel yükle veya /görsel komutu ver...',
    imagePromptPlaceholder: 'Oluşturmak istediğin görseli detaylıca tarif et...',
    send: 'Gönder',
    generateImgBtn: 'Görsel Üret',
    thinkingActive: 'Derin Düşünce: Açık',
    thinkingInactive: 'Derin Düşünce',
    webActive: 'Canlı Web: Açık',
    webInactive: 'Web\'de Ara',
    clear: 'Sohbeti Sıfırla',
    newChat: 'Yeni Sohbet',
    historyTitle: 'Sohbet Geçmişi',
    noHistory: 'Henüz kayıtlı sohbet yok.',
    searchPlaceholder: 'Sohbetlerde ara...',
    modesTitle: 'Sigma Motor Modları',
    deepBadge: 'Derin Düşünce Modu ile Üretildi',
    copied: 'Kopyalandı!',
    copy: 'Kopyala',
    online: 'Sigma Engine Aktif',
    offline: 'Secrets Bekleniyor',
    attachImage: 'Fotoğraf Yükle',
    imageGenMode: 'Görsel Stüdyosu',
    chatMode: 'Sohbet Modu',
    listening: 'Dinleniyor... Konuşun',
    stopVoice: 'Durdur',
    readAloud: 'Seslendir',
    regenerate: 'Yeniden Üret',
    exportChat: 'Dışa Aktar',
    editMessage: 'Mesajı Düzenle',
    pinMessage: 'Favorilere Ekle',
    unpinMessage: 'Favorilerden Çıkar',
    pinnedMessages: 'Yıldızlı Mesajlar',
    deleteConfirm: 'Bu sohbeti silmek istediğine emin misin?',
    enhancePrompt: 'İstemi Geliştir',
    enhancing: 'Geliştiriliyor...',
    personas: {
      general: { title: 'Genel Asistan', desc: 'Dengeli ve çok yönlü akıl' },
      coder: { title: 'Yazılım & Kodlama', desc: 'Mimari, algoritmalar & canlı önizleme' },
      writer: { title: 'Yaratıcı Yazar', desc: 'Oyun lore\'u, kurgu & senaryo' },
      tutor: { title: 'Özel Öğretmen', desc: 'Adım adım etkileşimli eğitim' },
      grok: { title: 'Sigma Grok', desc: 'Dobra, esprili ve cesur zeka' },
      artist: { title: 'Görsel & Sanat', desc: 'Konsept sanat, promptlar ve görsel fikirler' }
    },
    quickPrompts: [
      { label: '🎨 Cyberpunk Robot', prompt: 'Cyberpunk neon ışıklarıyla donatılmış, The Sigma Games logosu taşıyan fütüristik bir sibernetik robot görseli oluştur.' },
      { label: '🌐 2026 Trendleri', prompt: 'Web araması yaparak 2026 yılı yapay zeka ve oyun teknolojisi trendlerini kaynak linkleriyle detaylı açıkla.' },
      { label: '💻 Mini Canvas Oyunu', prompt: 'HTML5 Canvas ve JavaScript ile tek dosyada çalışan eğlenceli bir tıklama/yakalama mini oyunu kodu yaz.' },
      { label: '🎮 Roguelike Mekaniği', prompt: 'The Sigma Games için yenilikçi bir roguelike oyun mekaniği tasarla ve karşılaştırma tablosu hazırla.' }
    ]
  },
  en: {
    title: 'Sigma AI',
    subtitle: 'The Sigma Games AI Laboratory',
    welcome: 'Hello! I am **Sigma AI**, engineered by The Sigma Games.\n\nReady for AI image generation, live web search, software architecture, game lore, and deep reasoning.\n\nAsk me anything, attach an image, switch to **Image Gen**, or pick a persona from the sidebar.',
    placeholder: 'Message Sigma AI, attach an image, or use /imagine...',
    imagePromptPlaceholder: 'Describe the image you want to generate in detail...',
    send: 'Send',
    generateImgBtn: 'Generate Image',
    thinkingActive: 'Deep Think: On',
    thinkingInactive: 'Deep Think',
    webActive: 'Live Web: On',
    webInactive: 'Search Web',
    clear: 'Clear Chat',
    newChat: 'New Chat',
    historyTitle: 'Chat History',
    noHistory: 'No saved chats yet.',
    searchPlaceholder: 'Search chats...',
    modesTitle: 'Sigma Personas',
    deepBadge: 'Generated with Deep Thinking Mode',
    copied: 'Copied!',
    copy: 'Copy',
    online: 'Sigma Engine Online',
    offline: 'Secret Key Required',
    attachImage: 'Attach Photo',
    imageGenMode: 'Image Studio',
    chatMode: 'Chat Mode',
    listening: 'Listening... Speak now',
    stopVoice: 'Stop Voice',
    readAloud: 'Read Aloud',
    regenerate: 'Regenerate',
    exportChat: 'Export',
    editMessage: 'Edit Message',
    pinMessage: 'Bookmark',
    unpinMessage: 'Remove Bookmark',
    pinnedMessages: 'Bookmarked Messages',
    deleteConfirm: 'Are you sure you want to delete this chat?',
    enhancePrompt: 'Enhance Prompt',
    enhancing: 'Enhancing...',
    personas: {
      general: { title: 'General Assistant', desc: 'Balanced & versatile intellect' },
      coder: { title: 'Software & Code', desc: 'Architecture & live code preview' },
      writer: { title: 'Creative Writer', desc: 'Game lore, scripts & fiction' },
      tutor: { title: 'Personal Tutor', desc: 'Step-by-step master instruction' },
      grok: { title: 'Sigma Grok', desc: 'Witty, bold & gaming humor' },
      artist: { title: 'Art & Visuals', desc: 'Concept art, prompts & aesthetics' }
    },
    quickPrompts: [
      { label: '🎨 Cyberpunk Robot', prompt: 'Generate a futuristic cybernetic robot adorned with neon lights and The Sigma Games logo.' },
      { label: '🌐 2026 AI Trends', prompt: 'Search the live web and provide the top 2026 AI and gaming trends with clickable links.' },
      { label: '💻 Canvas Mini-Game', prompt: 'Write an interactive playable HTML5 canvas mini-game in a single clean code block.' },
      { label: '🎮 Roguelike Design', prompt: 'Design an innovative roguelike gameplay loop for The Sigma Games with a feature table.' }
    ]
  },
  de: {
    title: 'Sigma AI',
    subtitle: 'The Sigma Games KI-Labor',
    welcome: 'Hallo! Ich bin **Sigma AI**, entwickelt von The Sigma Games. Bereit für Bildgenerierung, Live-Websuche, Programmierung oder Tiefdenken.',
    placeholder: 'Frage Sigma AI etwas, hänge ein Bild an oder generiere...',
    imagePromptPlaceholder: 'Beschreibe das gewünschte Bild im Detail...',
    send: 'Senden',
    generateImgBtn: 'Bild Generieren',
    thinkingActive: 'Tiefdenken: Ein',
    thinkingInactive: 'Tiefdenken',
    webActive: 'Live-Web: Ein',
    webInactive: 'Im Web suchen',
    clear: 'Chat leeren',
    newChat: 'Neuer Chat',
    historyTitle: 'Chatverlauf',
    noHistory: 'Noch kein Verlauf.',
    searchPlaceholder: 'Suchen...',
    modesTitle: 'KI-Modi',
    deepBadge: 'Mit Tiefdenk-Modus generiert',
    copied: 'Kopiert!',
    copy: 'Kopieren',
    online: 'Sigma Engine Online',
    offline: 'Secret Key Erforderlich',
    attachImage: 'Bild anhängen',
    imageGenMode: 'Bildstudio',
    chatMode: 'Chat-Modus',
    listening: 'Höre zu...',
    stopVoice: 'Stopp',
    readAloud: 'Vorlesen',
    regenerate: 'Neu generieren',
    exportChat: 'Exportieren',
    editMessage: 'Bearbeiten',
    pinMessage: 'Merken',
    unpinMessage: 'Entfernen',
    pinnedMessages: 'Favoriten',
    deleteConfirm: 'Diesen Chat wirklich löschen?',
    enhancePrompt: 'Prompt Verbessern',
    enhancing: 'Verbessern...',
    personas: {
      general: { title: 'Allgemeiner Assistent', desc: 'Vielseitige Intelligenz' },
      coder: { title: 'Software & Code', desc: 'Architektur & Vorschau' },
      writer: { title: 'Kreativautor', desc: 'Geschichten & Game Lore' },
      tutor: { title: 'Privatlehrer', desc: 'Schritt-für-Schritt Lernen' },
      grok: { title: 'Sigma Grok', desc: 'Schlagfertig & humorvoll' },
      artist: { title: 'Visuelle Kunst', desc: 'Konzeptkunst & Prompts' }
    },
    quickPrompts: [
      { label: '🎨 Cyberpunk Bot', prompt: 'Erstelle ein Bild eines futuristischen Cyberpunk-Roboters im The Sigma Games Stil.' },
      { label: '🌐 2026 Trends', prompt: 'Suche im Web nach den neuesten KI-Trends 2026 mit Quellenlinks.' },
      { label: '💻 HTML5 Minispiel', prompt: 'Schreibe ein spielbares interaktives HTML5 Canvas Spiel in einem Codeblock.' },
      { label: '🎮 Spielmechanik', prompt: 'Entwirf ein innovatives Roguelike-System mit Vergleichstabelle.' }
    ]
  },
  es: {
    title: 'Sigma AI',
    subtitle: 'Laboratorio de IA de The Sigma Games',
    welcome: '¡Hola! Soy **Sigma AI**, desarrollado por The Sigma Games. Listo para generación de imágenes, búsqueda web en vivo, código y razonamiento profundo.',
    placeholder: 'Escribe a Sigma AI, sube una foto o genera imágenes...',
    imagePromptPlaceholder: 'Describe la imagen que deseas generar en detalle...',
    send: 'Enviar',
    generateImgBtn: 'Generar Imagen',
    thinkingActive: 'Pensamiento Profundo: Sí',
    thinkingInactive: 'Pensamiento Profundo',
    webActive: 'Web en Vivo: Sí',
    webInactive: 'Buscar en Web',
    clear: 'Limpiar Chat',
    newChat: 'Nuevo Chat',
    historyTitle: 'Historial',
    noHistory: 'Sin historial aún.',
    searchPlaceholder: 'Buscar...',
    modesTitle: 'Modos Sigma',
    deepBadge: 'Generado con Pensamiento Profundo',
    copied: '¡Copiado!',
    copy: 'Copiar',
    online: 'Motor Sigma En Línea',
    offline: 'Secret Requerido',
    attachImage: 'Adjuntar Foto',
    imageGenMode: 'Estudio de Imágenes',
    chatMode: 'Modo Chat',
    listening: 'Escuchando...',
    stopVoice: 'Detener',
    readAloud: 'Escuchar',
    regenerate: 'Regenerar',
    exportChat: 'Exportar',
    editMessage: 'Editar',
    pinMessage: 'Favorito',
    unpinMessage: 'Quitar Favorito',
    pinnedMessages: 'Mensajes Destacados',
    deleteConfirm: '¿Deseas eliminar esta conversación?',
    enhancePrompt: 'Mejorar Prompt',
    enhancing: 'Mejorando...',
    personas: {
      general: { title: 'Asistente General', desc: 'Intelecto equilibrado' },
      coder: { title: 'Software y Código', desc: 'Arquitectura y vista previa' },
      writer: { title: 'Escritor Creativo', desc: 'Lore de juegos y ficción' },
      tutor: { title: 'Tutor Personal', desc: 'Instrucción paso a paso' },
      grok: { title: 'Sigma Grok', desc: 'Ingenioso, directo y gamer' },
      artist: { title: 'Arte Visual', desc: 'Concept art y prompts' }
    },
    quickPrompts: [
      { label: '🎨 Robot Cyberpunk', prompt: 'Genera una imagen de un robot cibernético futurista al estilo The Sigma Games.' },
      { label: '🌐 Tendencias 2026', prompt: 'Busca en la web tendencias de videojuegos e IA en 2026 con enlaces.' },
      { label: '💻 Minijuego Canvas', prompt: 'Crea un minijuego interactivo funcional en HTML5 Canvas.' },
      { label: '🎮 Diseño Roguelike', prompt: 'Diseña un sistema roguelike innovador con tabla comparativa.' }
    ]
  }
};

/**
 * Formats inline text with robust support for:
 * 1. Markdown Links: [Title](https://...)
 * 2. Raw URLs: https://...
 * 3. Bold: **text**
 * 4. Italic: *text*
 * 5. Code: `inline`
 * 6. Strikethrough: ~~del~~
 * 7. Spoiler: ||spoiler||
 */
function formatInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Regex to match:
  // 1. [Link](url) -> group 2: title, group 3: url
  // 2. **bold** -> group 5
  // 3. *italic* -> group 7
  // 4. `code` -> group 9
  // 5. ~~strike~~ -> group 11
  // 6. ||spoiler|| -> group 13
  // 7. raw url https?:// -> group 14
  const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(~~([^~]+)~~)|(\|\|([^|]+)\|\|)|(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] !== undefined && match[3] !== undefined) {
      // [Link Text](URL)
      const linkText = match[2];
      const linkUrl = match[3];
      parts.push(
        <a
          key={`link-${idx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1 mx-0.5 transition-colors bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40 hover:border-cyan-500/60 shadow-sm"
          title={`Bağlantıya git: ${linkUrl}`}
        >
          <span>{linkText}</span>
          <ExternalLink className="w-3 h-3 inline opacity-70" />
        </a>
      );
    } else if (match[5] !== undefined) {
      // **bold**
      parts.push(
        <strong key={`b-${idx++}`} className="font-extrabold text-white tracking-wide">
          {match[5]}
        </strong>
      );
    } else if (match[7] !== undefined) {
      // *italic*
      parts.push(
        <em key={`i-${idx++}`} className="italic text-cyan-200/90 font-medium">
          {match[7]}
        </em>
      );
    } else if (match[9] !== undefined) {
      // `code`
      parts.push(
        <code key={`c-${idx++}`} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-[11px] border border-cyan-800/40">
          {match[9]}
        </code>
      );
    } else if (match[11] !== undefined) {
      // ~~strikethrough~~
      parts.push(
        <del key={`d-${idx++}`} className="line-through text-slate-400">
          {match[11]}
        </del>
      );
    } else if (match[13] !== undefined) {
      // ||spoiler||
      parts.push(
        <span
          key={`sp-${idx++}`}
          className="bg-slate-800 text-slate-800 hover:text-white px-1.5 py-0.5 rounded cursor-pointer transition-colors border border-slate-700 font-medium select-none hover:select-text"
          title="Spoiler - Görmek için tıkla"
        >
          {match[13]}
        </span>
      );
    } else if (match[14] !== undefined) {
      // Raw URL
      const rawUrl = match[14];
      parts.push(
        <a
          key={`rawurl-${idx++}`}
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1 mx-0.5 transition-colors bg-cyan-950/30 px-1 py-0.5 rounded border border-cyan-800/30 text-xs"
        >
          <span className="truncate max-w-[200px]">{rawUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
          <ExternalLink className="w-2.5 h-2.5 inline opacity-70" />
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Interactive Code Block with Live Preview (Claude Artifacts style)
 */
function CodeBlockWithArtifact({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const isPreviewable = ['html', 'htm', 'svg', 'javascript', 'js'].includes(language.toLowerCase());

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${language.toLowerCase() === 'javascript' || language.toLowerCase() === 'js' ? `<div id="app"></div><script>${code}</script>` : code}
      </body>
    </html>
  `;

  return (
    <div className="my-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 overflow-hidden font-mono text-xs shadow-xl shadow-black/50">
      <div className="bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/40">
            {language || 'kod'}
          </span>
          {isPreviewable && (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  activeTab === 'code' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>Kod</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  activeTab === 'preview' ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-500/30' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Canlı Önizle</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>

      {activeTab === 'code' ? (
        <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono text-[12px] selection:bg-cyan-900 selection:text-cyan-100">
          {code}
        </pre>
      ) : (
        <div className="p-3 bg-slate-900/60">
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-[#0f172a]">
            <iframe
              title="Artifact Preview"
              srcDoc={previewSrcDoc}
              sandbox="allow-scripts"
              className="w-full h-72 border-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Message renderer parsing headings (including ####), tables, lists, and inline links
 */
function FormattedMessage({
  content,
  isUser,
  sources
}: {
  content: string;
  isUser: boolean;
  sources?: GroundingSource[];
}) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-sans text-white text-xs sm:text-sm">{content}</div>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block (```lang ... ```)
    if (line.trim().startsWith('```')) {
      const codeLang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      const fullCode = codeLines.join('\n');
      elements.push(
        <CodeBlockWithArtifact
          key={`code-block-${i}`}
          code={fullCode}
          language={codeLang}
        />
      );
      continue;
    }

    // 2. Table Parsing: Check if current line contains | and next line is a separator (|---|)
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && /\|?\s*:?-+:?\s*\|/.test(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split('|')
          .map((c) => c.trim())
          .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));

        const separatorRow = tableLines[1]
          .split('|')
          .map((c) => c.trim())
          .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));

        const alignments = separatorRow.map((sep) => {
          const starts = sep.startsWith(':');
          const ends = sep.endsWith(':');
          if (starts && ends) return 'center';
          if (ends) return 'right';
          return 'left';
        });

        const dataRows = tableLines.slice(2).map((rowLine) =>
          rowLine
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''))
        );

        elements.push(
          <div key={`table-${i}`} className="my-3.5 overflow-x-auto rounded-xl border border-cyan-500/30 bg-slate-950/90 shadow-lg shadow-cyan-950/20">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-cyan-500/30 bg-cyan-950/40 text-cyan-300 font-extrabold">
                  {headerRow.map((h, colIdx) => (
                    <th
                      key={`th-${colIdx}`}
                      className="p-3 font-mono tracking-wider border-r last:border-r-0 border-cyan-500/20"
                      style={{ textAlign: (alignments[colIdx] as any) || 'left' }}
                    >
                      {formatInlineText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {dataRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-cyan-950/20 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${rIdx}-${cIdx}`}
                        className="p-3 text-slate-200 border-r last:border-r-0 border-slate-800/60 font-sans"
                        style={{ textAlign: (alignments[cIdx] as any) || 'left' }}
                      >
                        {formatInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Headings: explicit handling of 1 to 6 hash symbols
    if (line.startsWith('###### ')) {
      elements.push(
        <h6 key={`h6-${i}`} className="text-xs font-bold text-cyan-300 mt-2 mb-1 tracking-wider uppercase font-mono">
          {formatInlineText(line.slice(7))}
        </h6>
      );
      i++;
      continue;
    }
    if (line.startsWith('##### ')) {
      elements.push(
        <h5 key={`h5-${i}`} className="text-xs font-bold text-cyan-200 mt-2.5 mb-1 tracking-wide font-mono">
          {formatInlineText(line.slice(6))}
        </h5>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${i}`} className="text-sm font-bold text-cyan-300 mt-3 mb-1 font-mono flex items-center gap-1.5">
          <span className="text-cyan-500 font-mono text-xs">◆</span>
          {formatInlineText(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-cyan-400 rounded-sm inline-block" />
          {formatInlineText(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-extrabold text-cyan-300 mt-4 mb-2 pb-1 border-b border-cyan-800/40">
          {formatInlineText(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-black text-white mt-4 mb-2 pb-1.5 border-b border-cyan-500/50">
          {formatInlineText(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 4. Bullet lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().slice(2);
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 ml-1 text-slate-200 text-xs sm:text-sm">
          <span className="text-cyan-400 mt-1 select-none text-[10px]">•</span>
          <span className="flex-1 leading-relaxed">{formatInlineText(bulletText)}</span>
        </div>
      );
      i++;
      continue;
    }

    // 5. Numbered lists
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1 ml-1 text-slate-200 text-xs sm:text-sm">
          <span className="text-cyan-400 font-mono font-bold select-none text-xs">{numMatch[1]}.</span>
          <span className="flex-1 leading-relaxed">{formatInlineText(numMatch[2])}</span>
        </div>
      );
      i++;
      continue;
    }

    // 6. Blockquote
    if (line.trim().startsWith('> ')) {
      elements.push(
        <div key={`quote-${i}`} className="my-2.5 pl-3 py-1 border-l-2 border-cyan-400 bg-cyan-950/20 text-slate-300 text-xs italic rounded-r">
          {formatInlineText(line.trim().slice(2))}
        </div>
      );
      i++;
      continue;
    }

    // 7. Regular paragraph
    if (line.trim() === '') {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="my-1 text-slate-200 leading-relaxed text-xs sm:text-sm font-sans">
          {formatInlineText(line)}
        </p>
      );
    }
    i++;
  }

  // Render sources / grounding links if present
  const sourcesSection = sources && sources.length > 0 && (
    <div className="mt-4 pt-3 border-t border-slate-800/80">
      <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 mb-2 font-bold uppercase tracking-wider">
        <Globe className="w-3.5 h-3.5" />
        <span>Doğrulanmış Web Kaynakları ({sources.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s, idx) => (
          <a
            key={`source-${idx}`}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 text-[11px] transition-all shadow-sm"
          >
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span className="truncate max-w-[180px] font-medium">{s.title || s.url}</span>
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-0.5">
      {elements}
      {sourcesSection}
    </div>
  );
}

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('sigma_ai_sessions_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load sessions from localStorage', e);
    }
    const defaultId = 'session-' + Date.now();
    return [
      {
        id: defaultId,
        title: 'The Sigma Games Laboratuvarı',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        persona: 'general',
        language: 'tr',
        messages: [
          {
            id: 'welcome-msg',
            role: 'model',
            content: UI_TEXT.tr.welcome,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => sessions[0]?.id || 'default');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepThinking, setDeepThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; prompt?: string } | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showDataResetModal, setShowDataResetModal] = useState(false);

  // Application Mode State & Active Studio Tab
  const [activeAppTab, setActiveAppTab] = useState<AppTab>('chat');
  const [currentInspectorVideo, setCurrentInspectorVideo] = useState<{ url: string; title: string } | null>(null);
  const isImageMode = activeAppTab === 'image';
  const setIsImageMode = (val: boolean | ((prev: boolean) => boolean)) => {
    if (typeof val === 'function') {
      setActiveAppTab((prevTab) => (val(prevTab === 'image') ? 'image' : 'chat'));
    } else {
      setActiveAppTab(val ? 'image' : 'chat');
    }
  };
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('cyberpunk');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    configured: false,
    keyPreview: null,
    formatValid: false
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Current session helper
  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const t = UI_TEXT[currentSession?.language || 'tr'];

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sigma_ai_sessions_v3', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions to localStorage', e);
    }
  }, [sessions]);

  // Check Server Key Status
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (e) {
      console.error('Status check error:', e);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentSession.language === 'tr' ? 'tr-TR' : currentSession.language === 'de' ? 'de-DE' : currentSession.language === 'es' ? 'es-ES' : 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isImageMode) {
          setImagePrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } else {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      speechRecognitionRef.current = recognition;
    }
  }, [currentSession.language, isImageMode]);

  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      alert('Tarayıcınız Web Speech ses tanıma API\'sini desteklemiyor.');
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.lang = currentSession.language === 'tr' ? 'tr-TR' : currentSession.language === 'de' ? 'de-DE' : currentSession.language === 'es' ? 'es-ES' : 'en-US';
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [Kod Bloğu] ')
      .replace(/\|[\s\S]*?\|/g, ' ')
      .replace(/[#*`~_\[\]\(\)]/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentSession.language === 'tr' ? 'tr-TR' : currentSession.language === 'de' ? 'de-DE' : currentSession.language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Image File Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir görsel dosyası seçin (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAttachedImage({
        data: base64,
        mimeType: file.type,
        name: file.name,
        size: file.size
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Clipboard Paste Support for Images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let j = 0; j < items.length; j++) {
      if (items[j].type.indexOf('image') !== -1) {
        const file = items[j].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachedImage({
              data: event.target?.result as string,
              mimeType: file.type,
              name: 'Pasted_Image_' + Date.now(),
              size: file.size
            });
          };
          reader.readAsDataURL(file);
          e.preventDefault();
        }
        break;
      }
    }
  };

  // Session Management
  const handleCreateNewChat = () => {
    const newId = 'session-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'Yeni Sohbet',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: currentSession.persona,
      language: currentSession.language,
      messages: [
        {
          id: 'welcome-' + newId,
          role: 'model',
          content: t.welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewChat();
      return;
    }
    const filtered = sessions.filter((s) => s.id !== id);
    setSessions(filtered);
    if (currentSessionId === id) {
      setCurrentSessionId(filtered[0].id);
    }
  };

  // Delete single message from active chat
  const handleDeleteMessage = (msgId: string) => {
    const updated = currentSession.messages.filter((m) => m.id !== msgId);
    updateSessionMessages(currentSession.id, updated);
  };

  // Clear current chat session messages
  const handleClearCurrentChat = () => {
    updateSessionMessages(currentSession.id, [
      {
        id: 'welcome-' + Date.now(),
        role: 'model',
        content: t.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Clear all chat sessions
  const handleClearAllChatSessions = () => {
    const defaultId = 'session-' + Date.now();
    const freshSession: ChatSession = {
      id: defaultId,
      title: 'The Sigma Games Laboratuvarı',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      persona: 'general',
      language: 'tr',
      messages: [
        {
          id: 'welcome-fresh',
          role: 'model',
          content: t.welcome,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setSessions([freshSession]);
    setCurrentSessionId(defaultId);
    localStorage.removeItem('sigma_ai_sessions_v3');
  };

  // Global Data Reset Function
  const handleGlobalDataReset = (target: 'all' | 'videos' | 'video_inspection' | 'debates' | 'chats' | 'game') => {
    if (target === 'all' || target === 'videos') {
      localStorage.removeItem('sigma_ai_video_projects_v2');
      localStorage.removeItem('sigma_ai_video_projects_v1');
    }
    if (target === 'all' || target === 'video_inspection') {
      localStorage.removeItem('sigma_last_video_inspection');
    }
    if (target === 'all' || target === 'debates') {
      localStorage.removeItem('sigma_ai_debate_history_v1');
    }
    if (target === 'all' || target === 'chats') {
      handleClearAllChatSessions();
    }
    if (target === 'all' || target === 'game') {
      localStorage.removeItem('sigma_cyber_runner_highscore_v1');
    }
    if (target === 'all') {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSaveTitle = (id: string) => {
    if (!editingTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: editingTitle.trim(), updatedAt: Date.now() } : s))
    );
    setEditingSessionId(null);
  };

  const updateSessionMessages = (sessionId: string, newMessages: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          let title = s.title;
          if (s.title === 'Yeni Sohbet' || s.title === 'The Sigma Games Laboratuvarı') {
            const firstUserMsg = newMessages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
            }
          }
          return {
            ...s,
            title,
            messages: newMessages,
            updatedAt: Date.now()
          };
        }
        return s;
      })
    );
  };

  // Export Chat
  const handleExportChat = (format: 'md' | 'txt' | 'json') => {
    let content = '';
    let filename = `sigma_ai_chat_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(currentSession, null, 2);
      filename += '.json';
    } else if (format === 'txt') {
      content = currentSession.messages.map((m) => `[${m.timestamp}] ${m.role === 'user' ? 'KULLANICI' : 'SIGMA AI'}:\n${m.content}\n`).join('\n---\n\n');
      filename += '.txt';
    } else {
      content = `# ${currentSession.title}\n*The Sigma Games - Sigma AI Sohbet Dökümü*\n\n` +
        currentSession.messages.map((m) => `### ${m.role === 'user' ? '👤 Kullanıcı' : '⚡ Sigma AI'} (${m.timestamp})\n\n${m.content}\n`).join('\n---\n\n');
      filename += '.md';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Prompt Enhancement via /api/enhance-prompt
  const handleEnhancePrompt = async () => {
    const rawPrompt = imagePrompt || input;
    if (!rawPrompt.trim()) return;

    setIsEnhancingPrompt(true);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: rawPrompt })
      });
      const data = await res.json();
      if (data.enhancedPrompt) {
        if (isImageMode) {
          setImagePrompt(data.enhancedPrompt);
        } else {
          setInput(data.enhancedPrompt);
        }
      }
    } catch (e) {
      console.warn('Enhance prompt failed:', e);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Dedicated AI Image Generation Call
  const handleGenerateImage = async (customPrompt?: string) => {
    const targetPrompt = customPrompt || imagePrompt || input;
    if (!targetPrompt.trim() || isLoading) return;

    setIsLoading(true);
    const userMsgId = 'user-' + Date.now();
    const modelMsgId = 'model-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: `🎨 [Görsel Üret]: ${targetPrompt}`,
      timestamp: timeStr
    };

    const updatedMessages = [...currentSession.messages, userMessage];
    updateSessionMessages(currentSession.id, updatedMessages);
    setImagePrompt('');
    setInput('');

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          aspectRatio,
          style: imageStyle
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorText = data.error || 'Görsel üretilemedi.';
        updateSessionMessages(currentSession.id, [
          ...updatedMessages,
          {
            id: modelMsgId,
            role: 'model',
            content: `⚠️ **Görsel Üretim Hatası:** ${errorText}\n\nLütfen farklı bir açıklama veya stil seçip tekrar deneyin.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        return;
      }

      const generatedImage: GeneratedImage = {
        url: data.imageUrl,
        prompt: data.prompt,
        originalPrompt: targetPrompt,
        model: data.model,
        aspectRatio: data.aspectRatio,
        timestamp: data.timestamp
      };

      const modelMessage: ChatMessage = {
        id: modelMsgId,
        role: 'model',
        content: `İşte The Sigma Games estetiğinde oluşturduğun görsel:\n\n**İstem:** *${targetPrompt}*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedImage
      };

      updateSessionMessages(currentSession.id, [...updatedMessages, modelMessage]);
    } catch (err: any) {
      updateSessionMessages(currentSession.id, [
        ...updatedMessages,
        {
          id: modelMsgId,
          role: 'model',
          content: `⚠️ **Bağlantı Hatası:** ${err?.message || 'Görsel sunucusuna erişilemedi.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Standard Multi-Turn Chat Submit
  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend !== undefined ? textToSend : input;
    if ((!rawText.trim() && !attachedImage) || isLoading) return;

    // Check if user specifically entered /imagine or /görsel
    if (rawText.trim().startsWith('/imagine ') || rawText.trim().startsWith('/görsel ')) {
      const promptOnly = rawText.replace(/^(\/imagine|\/görsel)\s+/i, '');
      handleGenerateImage(promptOnly);
      return;
    }

    const userMsgId = 'user-' + Date.now();
    const modelMsgId = 'model-' + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: rawText,
      timestamp: timeStr,
      image: attachedImage || undefined
    };

    const currentImage = attachedImage;
    setAttachedImage(null);
    setInput('');

    const updatedMessages = [...currentSession.messages, newUserMessage];
    updateSessionMessages(currentSession.id, updatedMessages);
    setIsLoading(true);

    try {
      const payloadMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image ? { data: m.image.data, mimeType: m.image.mimeType } : undefined
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          persona: currentSession.persona,
          language: currentSession.language,
          deepThinking,
          webSearch
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        let errorContent = `⚠️ **Hata Oluştu:** ${data.error || 'Sigma AI yanıt veremedi.'}`;
        if (data.help) {
          errorContent += `\n\n💡 **Çözüm Önerisi:**\n${data.help}`;
        }

        const errorMessage: ChatMessage = {
          id: modelMsgId,
          role: 'model',
          content: errorContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        updateSessionMessages(currentSession.id, [...updatedMessages, errorMessage]);
        return;
      }

      const modelMessage: ChatMessage = {
        id: modelMsgId,
        role: 'model',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deepThinking: data.deepThinking,
        webSearch: data.webSearch,
        sources: data.sources || [],
        latencyMs: data.latencyMs
      };

      updateSessionMessages(currentSession.id, [...updatedMessages, modelMessage]);
    } catch (err: any) {
      updateSessionMessages(currentSession.id, [
        ...updatedMessages,
        {
          id: modelMsgId,
          role: 'model',
          content: `⚠️ **Ağ Bağlantı Hatası:** ${err?.message || 'Bilinmeyen bir hata oluştu.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (isLoading || currentSession.messages.length < 2) return;
    const lastUserIdx = [...currentSession.messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;
    const realIdx = currentSession.messages.length - 1 - lastUserIdx;
    const trimmed = currentSession.messages.slice(0, realIdx + 1);
    updateSessionMessages(currentSession.id, trimmed);

    setIsLoading(true);
    const modelMsgId = 'model-' + Date.now();

    try {
      const payloadMessages = trimmed.map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image ? { data: m.image.data, mimeType: m.image.mimeType } : undefined
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          persona: currentSession.persona,
          language: currentSession.language,
          deepThinking,
          webSearch
        })
      });

      const data = await response.json();
      if (data.success) {
        updateSessionMessages(currentSession.id, [
          ...trimmed,
          {
            id: modelMsgId,
            role: 'model',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            deepThinking: data.deepThinking,
            webSearch: data.webSearch,
            sources: data.sources || [],
            latencyMs: data.latencyMs
          }
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit User Message & Resend
  const handleSaveEditedMessage = (msgId: string) => {
    if (!editingMessageText.trim()) {
      setEditingMessageId(null);
      return;
    }
    const idx = currentSession.messages.findIndex((m) => m.id === msgId);
    if (idx === -1) return;

    const trimmed = currentSession.messages.slice(0, idx);
    setEditingMessageId(null);
    updateSessionMessages(currentSession.id, trimmed);
    handleSendMessage(editingMessageText.trim());
  };

  // Bookmark / Pin Message
  const handleTogglePin = (msgId: string) => {
    const updated = currentSession.messages.map((m) =>
      m.id === msgId ? { ...m, isPinned: !m.isPinned } : m
    );
    updateSessionMessages(currentSession.id, updated);
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const displayedMessages = showPinnedOnly
    ? currentSession.messages.filter((m) => m.isPinned)
    : currentSession.messages;

  return (
    <div className="flex h-screen w-full bg-[#090d16] text-slate-100 font-sans overflow-hidden">
      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt="Generated Visual"
              referrerPolicy="no-referrer"
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl border border-cyan-500/40"
            />
            {lightboxImage.prompt && (
              <p className="mt-3 text-xs text-slate-300 max-w-2xl text-center bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
                {lightboxImage.prompt}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <a
                href={lightboxImage.url}
                download="sigma_ai_render.png"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>İndir (HD)</span>
              </a>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR: Sessions, Modes & Quick Actions */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-[#0c1220] border-r border-cyan-900/30 flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-cyan-950 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-white flex items-center gap-1 font-mono">
                SIGMA AI
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-sans border border-cyan-500/30">
                  PRO
                </span>
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono">THE SIGMA GAMES</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat & Studio Suite Switcher */}
        <div className="p-3 space-y-1.5 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setActiveAppTab('chat');
              handleCreateNewChat();
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-600/20 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newChat}</span>
          </button>

          {/* Quick Studio Suite Menu */}
          <div className="pt-1.5 space-y-1">
            <button
              type="button"
              onClick={() => setActiveAppTab('chat')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'chat'
                  ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>💬 Sohbet & Akıl</span>
            </button>



            <button
              type="button"
              onClick={() => setActiveAppTab('video-inspect')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'video-inspect'
                  ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="flex-1 text-left">👁️ Video İnceleme</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('image')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'image'
                  ? 'bg-pink-950/70 border border-pink-500/50 text-pink-200 shadow-sm shadow-pink-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-pink-400" />
              <span>🎨 Görsel Stüdyosu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('audio')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'audio'
                  ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>🎵 Ses & Ambiyans</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('sandbox')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'sandbox'
                  ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 shadow-sm shadow-emerald-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Canlı Kod Sandbox</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('debate')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'debate'
                  ? 'bg-purple-950/70 border border-purple-500/50 text-purple-200 shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-purple-400" />
              <span>⚔️ Ajan Münazarası</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('game3d')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'game3d'
                  ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 shadow-sm shadow-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="flex-1 text-left">🎮 3D Cyber Oyun (Three.js)</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">60FPS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAppTab('vault')}
              className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                activeAppTab === 'vault'
                  ? 'bg-amber-950/70 border border-amber-500/50 text-amber-200 shadow-sm shadow-amber-500/20'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>📚 Mega Şablonlar</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDataResetModal(true)}
              className="w-full mt-2 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Verileri Yönet & Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Search Session Filter */}
        <div className="px-3 pt-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 text-xs text-slate-200 placeholder-slate-500 border border-slate-800 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-500 px-2 py-1 flex items-center justify-between">
            <span>{t.historyTitle}</span>
            <span>{filteredSessions.length}</span>
          </div>

          {filteredSessions.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-600 font-mono">{t.noHistory}</div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200 font-semibold shadow-xs'
                      : 'border-transparent text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    {editingSessionId === session.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(session.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle(session.id);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                    <button
                      type="button"
                      title="Yeniden Adlandır"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditingTitle(session.title);
                      }}
                      className="p-1 hover:text-cyan-300 text-slate-400"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title="Sil"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1 hover:text-rose-400 text-slate-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Persona Selectors & Language */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0a0f1a] space-y-2.5">
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center justify-between">
              <span>{t.modesTitle}</span>
              <span className="text-cyan-400 font-bold">{t.personas[currentSession.persona]?.title}</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['general', 'coder', 'writer', 'tutor', 'grok', 'artist'] as Persona[]).map((p) => {
                const isActive = currentSession.persona === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSessions((prev) =>
                        prev.map((s) => (s.id === currentSessionId ? { ...s, persona: p } : s))
                      );
                    }}
                    title={t.personas[p]?.desc}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold text-center truncate transition-all border ${
                      isActive
                        ? p === 'grok'
                          ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 shadow-xs'
                          : p === 'artist'
                          ? 'bg-pink-950/60 border-pink-500/50 text-pink-300 shadow-xs'
                          : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {p === 'grok' && '⚡ '}
                    {p === 'artist' && '🎨 '}
                    {p === 'coder' && '💻 '}
                    {p === 'writer' && '✍️ '}
                    {p === 'tutor' && '🎓 '}
                    {p === 'general' && '⭐ '}
                    {t.personas[p]?.title.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>DİL</span>
            </span>
            <div className="flex gap-1">
              {(['tr', 'en', 'de', 'es'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSessions((prev) =>
                      prev.map((s) => (s.id === currentSessionId ? { ...s, language: lang } : s))
                    );
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                    currentSession.language === lang
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CHAT & WORKSPACE AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#090d16] to-[#070a12]">
        {/* Top Navbar */}
        <header className="h-14 border-b border-cyan-900/30 px-4 flex items-center justify-between bg-slate-950/60 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg bg-slate-900"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                  {currentSession.title}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 hidden sm:inline-block">
                  {t.personas[currentSession.persona]?.title}
                </span>
              </div>
            </div>
          </div>

            {/* Top Quick Studio Mode Pill Selector */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveAppTab('chat')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'chat' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Sohbet</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('video')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'video' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video 8K</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('video-inspect')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'video-inspect' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Video İnceleme</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('image')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'image' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Görsel</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('audio')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'audio' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Ses & SFX</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('sandbox')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'sandbox' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Sandbox</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('debate')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'debate' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Münazara</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('vault')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'vault' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Şablonlar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveAppTab('game3d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeAppTab === 'game3d' ? 'bg-cyan-600 text-white shadow-sm font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>3D Oyun</span>
              </button>
            </div>

            {/* Right Action Tools: Web Search, Deep Thinking, Pinned, Export */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Clear Current Chat Button */}
              {activeAppTab === 'chat' && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Mevcut sohbet mesajlarını temizlemek istediğinize emin misiniz?')) {
                      handleClearCurrentChat();
                    }
                  }}
                  title="Bu Sohbeti Temizle"
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Temizle</span>
                </button>
              )}

              {/* Global Data Manager Button */}
              <button
                type="button"
                onClick={() => setShowDataResetModal(true)}
                title="Tüm Verileri Yönet & Sıfırla"
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Live Web Search Grounding Toggle */}
            <button
              type="button"
              onClick={() => setWebSearch(!webSearch)}
              title="Canlı Google Web Araması ve Bağlantılar"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                webSearch
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm shadow-blue-500/30 font-bold'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${webSearch ? 'text-white' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{webSearch ? t.webActive : t.webInactive}</span>
            </button>

            {/* Deep Thinking Toggle */}
            <button
              type="button"
              onClick={() => setDeepThinking(!deepThinking)}
              title="Derinlemesine analiz ve çok yönlü akıl yürütme"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                deepThinking
                  ? 'bg-purple-600 text-white border-purple-400 shadow-sm shadow-purple-500/30 font-bold'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 ${deepThinking ? 'text-white' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{deepThinking ? t.thinkingActive : t.thinkingInactive}</span>
            </button>

            {/* Pinned Messages Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
              title={showPinnedOnly ? 'Tüm Mesajları Göster' : 'Sadece Yıldızlı Mesajları Göster'}
              className={`p-2 rounded-xl text-xs font-semibold transition-all border ${
                showPinnedOnly
                  ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            {/* Export Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center gap-1"
                title="Sohbeti İndir"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Dışa Aktar</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-30">
                <button
                  type="button"
                  onClick={() => handleExportChat('md')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportChat('txt')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileCode className="w-3 h-3 text-emerald-400" />
                  <span>Metin (.txt)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportChat('json')}
                  className="w-full px-3 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Code2 className="w-3 h-3 text-purple-400" />
                  <span>JSON Yedek</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Studio Tab Routing */}
        {activeAppTab === 'video' ? (
          <VideoStudio
            onSendToChat={(txt) => { setActiveAppTab('chat'); handleSendMessage(txt); }}
            onNavigateToInspector={(videoUrl, title) => {
              setCurrentInspectorVideo({ url: videoUrl, title });
              setActiveAppTab('video-inspect');
            }}
          />
        ) : activeAppTab === 'video-inspect' ? (
          <VideoInspector
            initialVideoUrl={currentInspectorVideo?.url}
            initialTitle={currentInspectorVideo?.title}
            onSendToVideoStudio={(prompt) => {
              setActiveAppTab('video');
            }}
            onSendToChat={(txt) => {
              setActiveAppTab('chat');
              handleSendMessage(txt);
            }}
          />
        ) : activeAppTab === 'audio' ? (
          <AudioStudio />
        ) : activeAppTab === 'sandbox' ? (
          <CodeSandbox onSendToChat={(txt) => { setActiveAppTab('chat'); handleSendMessage(txt); }} />
        ) : activeAppTab === 'debate' ? (
          <DebateArena onSendToChat={(txt) => { setActiveAppTab('chat'); handleSendMessage(txt); }} />
        ) : activeAppTab === 'vault' ? (
          <PromptVault
            onSendToChat={(txt) => { setActiveAppTab('chat'); handleSendMessage(txt); }}
            onSendToImage={(txt) => { setActiveAppTab('image'); setImagePrompt(txt); }}
            onSendToVideo={() => { setActiveAppTab('video'); }}
          />
        ) : activeAppTab === 'game3d' ? (
          <ThreeGameStudio onSendToChat={(txt) => { setActiveAppTab('chat'); handleSendMessage(txt); }} />
        ) : (
          <>
        {/* MESSAGES LIST AREA */}
        <div
          onPaste={handlePaste}
          className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4"
        >
          {showPinnedOnly && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Yıldızlı Mesajlar Filtrelendi ({displayedMessages.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPinnedOnly(false)}
                className="underline hover:text-white"
              >
                Filtreyi Kaldır
              </button>
            </div>
          )}

          {displayedMessages.map((message) => {
            const isUser = message.role === 'user';
            const wordCount = message.content ? message.content.split(/\s+/).filter(Boolean).length : 0;
            const readingTimeMin = Math.max(1, Math.ceil(wordCount / 180));

            return (
              <div
                key={message.id}
                className={`flex gap-3 group ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 text-white mt-0.5">
                    <Zap className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender & Timestamp & Pinned Action */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'Sen' : 'Sigma AI'}
                    </span>
                    <span>•</span>
                    <span>{message.timestamp}</span>

                    {/* Bookmark Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(message.id)}
                      title={message.isPinned ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
                      className={`p-0.5 transition-colors ${
                        message.isPinned ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Bookmark className="w-3 h-3 fill-current" />
                    </button>

                    {/* Delete Message Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 cursor-pointer"
                      title="Bu mesajı sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Edit User Message Button */}
                    {isUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(message.id);
                          setEditingMessageText(message.content);
                        }}
                        className="text-slate-500 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        title="Mesajı Düzenle ve Yeniden Gönder"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Attached User Image Display */}
                  {message.image && (
                    <div className="mb-2 max-w-sm rounded-xl overflow-hidden border border-cyan-500/40 shadow-lg">
                      <img
                        src={message.image.data}
                        alt="Yüklenen Görsel"
                        referrerPolicy="no-referrer"
                        className="w-full max-h-60 object-cover cursor-pointer hover:scale-102 transition-transform"
                        onClick={() => setLightboxImage({ url: message.image!.data, prompt: message.image!.name })}
                      />
                    </div>
                  )}

                  {/* AI Generated Image Card Display */}
                  {message.generatedImage && (
                    <div className="mb-3 max-w-md rounded-2xl overflow-hidden border border-purple-500/40 bg-slate-950 shadow-2xl shadow-purple-950/40">
                      <div className="relative group/img">
                        <img
                          src={message.generatedImage.url}
                          alt={message.generatedImage.prompt}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-cover max-h-80 cursor-pointer"
                          onClick={() =>
                            setLightboxImage({
                              url: message.generatedImage!.url,
                              prompt: message.generatedImage!.prompt
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              url: message.generatedImage!.url,
                              prompt: message.generatedImage!.prompt
                            })
                          }
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black"
                          title="Tam Ekran"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-purple-300 font-mono text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                          <span>{message.generatedImage.model || 'Sigma Vision'}</span>
                          <span>•</span>
                          <span>{message.generatedImage.aspectRatio || '1:1'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(message.generatedImage!.originalPrompt || message.generatedImage!.prompt);
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            title="İstemi Kopyala"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={message.generatedImage.url}
                            download="sigma_ai_render.png"
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1 text-[11px]"
                          >
                            <Download className="w-3 h-3" />
                            <span>İndir</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 relative border transition-shadow ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40 rounded-tr-xs shadow-md shadow-cyan-600/10'
                        : 'bg-slate-900/95 text-slate-100 border-cyan-900/40 rounded-tl-xs shadow-lg shadow-black/40'
                    }`}
                  >
                    {/* Inline Edit Form */}
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-cyan-400 rounded-lg text-xs text-white focus:outline-none min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setEditingMessageId(null)}
                            className="px-2 py-1 rounded bg-slate-800 text-slate-300"
                          >
                            Vazgeç
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditedMessage(message.id)}
                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                          >
                            Kaydet ve Yeniden Gönder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <FormattedMessage
                        content={message.content}
                        isUser={isUser}
                        sources={message.sources}
                      />
                    )}
                  </div>

                  {/* Assistant Footer Stats & Actions */}
                  {!isUser && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 px-1 text-[11px] text-slate-400 font-mono">
                      {/* Deep Thinking Badge */}
                      {message.deepThinking && (
                        <span className="flex items-center gap-1 text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-800/40">
                          <Brain className="w-3 h-3" />
                          <span>Derin Analiz</span>
                        </span>
                      )}

                      {/* Web Search Badge */}
                      {message.webSearch && (
                        <span className="flex items-center gap-1 text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-full border border-blue-800/40">
                          <Globe className="w-3 h-3" />
                          <span>Canlı Web</span>
                        </span>
                      )}

                      {/* Latency & Word Count */}
                      {message.latencyMs && (
                        <span>{(message.latencyMs / 1000).toFixed(1)}s</span>
                      )}
                      <span>{wordCount} kelime (~{readingTimeMin} dk)</span>

                      {/* TTS Speak Button */}
                      <button
                        type="button"
                        onClick={() => handleSpeakText(message.content)}
                        className={`flex items-center gap-1 hover:text-cyan-300 transition-colors ${
                          isSpeaking ? 'text-cyan-400 font-bold animate-pulse' : 'text-slate-400'
                        }`}
                        title="Sesli Oku"
                      >
                        {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                        <span>{isSpeaking ? 'Durdur' : 'Seslendir'}</span>
                      </button>

                      {/* Copy Response Button */}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                        }}
                        className="flex items-center gap-1 hover:text-cyan-300 transition-colors"
                        title="Tüm Yanıtı Kopyala"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Kopyala</span>
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/20 text-white mt-0.5 animate-pulse">
                <Zap className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-xs bg-slate-900 border border-cyan-500/40 shadow-lg flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-mono text-cyan-300 tracking-wider">
                  {isImageMode ? 'Sigma Vision görseli çiziyor...' : deepThinking ? 'Sigma AI derinlemesine düşünüyor ve analiz ediyor...' : 'Sigma AI yanıt üretiyor...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* QUICK PROMPT SUGGESTIONS (if few messages) */}
        {currentSession.messages.length <= 1 && (
          <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {t.quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (qp.prompt.includes('görseli oluştur')) {
                      setIsImageMode(true);
                      setImagePrompt(qp.prompt);
                    } else {
                      setInput(qp.prompt);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap transition-all shadow-xs"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DEDICATED IMAGE GENERATION STUDIO BAR (When isImageMode is active) */}
        {isImageMode ? (
          <div className="p-3 sm:p-4 border-t border-purple-500/40 bg-gradient-to-t from-purple-950/30 via-slate-950 to-slate-950 shrink-0">
            <div className="max-w-4xl mx-auto space-y-3">
              {/* Studio Header & Aspect Ratio / Style Selectors */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-pink-400 flex items-center gap-1.5 font-mono">
                    <Wand2 className="w-4 h-4" />
                    <span>GÖRSEL STÜDYOSU</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Pollinations Flux + Gemini Vision</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Aspect Ratio */}
                  <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                    {(['1:1', '16:9', '9:16', '4:3'] as AspectRatio[]).map((ar) => (
                      <button
                        key={ar}
                        type="button"
                        onClick={() => setAspectRatio(ar)}
                        className={`px-2 py-0.5 rounded font-mono transition-colors ${
                          aspectRatio === ar ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {ar}
                      </button>
                    ))}
                  </div>

                  {/* Style Presets */}
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                    className="bg-slate-900 border border-slate-800 text-purple-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                  >
                    <option value="cyberpunk">🌌 Siberpunk (Sigma Games)</option>
                    <option value="photo">📸 Fotogerçekçi (8K Realism)</option>
                    <option value="anime">🎌 Anime / Manga</option>
                    <option value="3d">🧊 3D Render (Octane)</option>
                    <option value="fantasy">🔮 Epik Fantezi</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsImageMode(false)}
                    className="p-1 hover:text-white text-slate-400"
                    title="Kapat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prompt Input & Action Buttons */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-purple-500/40 rounded-2xl p-2 shadow-xl shadow-purple-950/20">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerateImage();
                    }
                  }}
                  placeholder={t.imagePromptPlaceholder}
                  className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
                />

                {/* Prompt Enhancer Button */}
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt || !imagePrompt.trim()}
                  title="Sigma AI ile promptu 8K detaylı hale getir"
                  className="px-2.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isEnhancingPrompt ? t.enhancing : t.enhancePrompt}</span>
                </button>

                {/* Speech-to-Text Mic */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-xl border transition-colors ${
                    isListening ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Sesle Yaz"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={() => handleGenerateImage()}
                  disabled={isLoading || !imagePrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-98"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{t.generateImgBtn}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD CHAT INPUT BAR */
          <div className="p-3 sm:p-4 border-t border-cyan-900/30 bg-slate-950/90 shrink-0">
            <div className="max-w-4xl mx-auto">
              {/* Attached Image Preview */}
              {attachedImage && (
                <div className="mb-2.5 flex items-center gap-2.5 p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/40 max-w-sm">
                  <img
                    src={attachedImage.data}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-lg border border-cyan-500/40"
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-semibold text-white truncate">{attachedImage.name}</div>
                    <div className="text-[10px] text-cyan-300 font-mono">
                      {(attachedImage.size / 1024).toFixed(0)} KB • Multimodal Analiz Hazır
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="p-1 hover:text-rose-400 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-2 focus-within:border-cyan-500/60 shadow-xl shadow-black/30 transition-all"
              >
                {/* Image Upload Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                  title={t.attachImage}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* Quick Image Mode Switcher */}
                <button
                  type="button"
                  onClick={() => setIsImageMode(true)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-pink-300 transition-colors"
                  title="Görsel Oluşturma Modu"
                >
                  <Wand2 className="w-4 h-4" />
                </button>

                {/* Main Text Input */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={t.placeholder}
                  rows={1}
                  className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none resize-none font-sans"
                />

                {/* Speech Dictation Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`p-2 rounded-xl border transition-colors ${
                    isListening ? 'bg-rose-600 text-white border-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title="Sesle Yaz"
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* Regenerate Button */}
                {currentSession.messages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors disabled:opacity-40"
                    title={t.regenerate}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !attachedImage)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all disabled:opacity-40 active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.send}</span>
                </button>
              </form>

              {/* Status and Hint Footer */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${serverStatus.configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span>{serverStatus.configured ? t.online : t.offline}</span>
                  </span>
                  <span>•</span>
                  <span>Shift+Enter yeni satır</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>The Sigma Games v3.2</span>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* GLOBAL DATA MANAGEMENT & WIPE MODAL */}
      {showDataResetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl shadow-rose-950/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-mono">VERİ YÖNETİMİ & SIFIRLAMA</h2>
                  <p className="text-[11px] text-slate-400">İstediğiniz kategoriyi tek tek veya her şeyi tamamen silin.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDataResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Videos */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Film className="w-4 h-4 text-violet-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Video Arşivi</div>
                    <div className="text-[10px] text-slate-500">Kayıtlı tüm video projelerini sil</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleGlobalDataReset('videos');
                    alert('Video arşivi başarıyla temizlendi.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sil
                </button>
              </div>

              {/* Option 1.5: Video Inceleme */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Video İnceleme Analizleri</div>
                    <div className="text-[10px] text-slate-500">Geçmiş video kare analiz raporlarını temizle</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleGlobalDataReset('video_inspection');
                    alert('Video inceleme raporları başarıyla temizlendi.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sil
                </button>
              </div>

              {/* Option 2: Debates */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Swords className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Münazara Geçmişi</div>
                    <div className="text-[10px] text-slate-500">Tüm münazara turlarını ve zihin haritalarını sil</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleGlobalDataReset('debates');
                    alert('Münazara geçmişi temizlendi.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sil
                </button>
              </div>

              {/* Option 3: Chats */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Sohbet Geçmişi</div>
                    <div className="text-[10px] text-slate-500">Tüm sohbet oturumlarını temizle</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleGlobalDataReset('chats');
                    alert('Tüm sohbet geçmişi sıfırlandı.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sil
                </button>
              </div>

              {/* Option 4: 3D Game Highscore */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">3D Oyun Rekorları</div>
                    <div className="text-[10px] text-slate-500">Three.js uzay oyunu skorlarını sıfırla</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleGlobalDataReset('game');
                    alert('Oyun rekorları sıfırlandı.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sil
                </button>
              </div>
            </div>

            {/* Complete Factory Reset */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('DİKKAT: Tüm tarayıcı verileri, videolar, sohbetler ve münazaralar kalıcı olarak silinecek ve sayfa yenilenecek. Devam edilsin mi?')) {
                    handleGlobalDataReset('all');
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>HER ŞEYİ SIFIRLA (TAM FABRİKA TEMİZLİĞİ)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

