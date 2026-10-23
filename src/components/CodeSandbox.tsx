import React, { useState } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Sparkles,
  Gamepad2,
  Layers,
  FileCode,
  Download
} from 'lucide-react';

interface CodeTemplate {
  id: string;
  name: string;
  desc: string;
  icon: string;
  code: string;
}

const TEMPLATES: CodeTemplate[] = [
  {
    id: 'pong',
    name: '🎮 Neon Cyber Pong',
    desc: 'Oynanabilir 2D neon retro pong oyunu',
    icon: 'gamepad',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #050811; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: monospace; color: #00f3ff; }
    canvas { border: 2px solid #00f3ff; box-shadow: 0 0 25px rgba(0,243,255,0.4); border-radius: 12px; background: #02040a; }
    .score { font-size: 24px; font-weight: bold; margin-bottom: 10px; letter-spacing: 2px; }
    .hint { font-size: 11px; color: #8892b0; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="score">OYUNCU <span id="pScore">0</span> : <span id="aiScore">0</span> SIGMA AI</div>
  <canvas id="c" width="600" height="360"></canvas>
  <div class="hint">Farenizi yukarı/aşağı hareket ettirerek sol raketi kontrol edin.</div>

  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    let pY = 140, aiY = 140;
    let bX = 300, bY = 180, bVx = 5, bVy = 3;
    let pScore = 0, aiScore = 0;
    const pW = 12, pH = 75;

    c.addEventListener('mousemove', (e) => {
      const rect = c.getBoundingClientRect();
      pY = e.clientY - rect.top - pH / 2;
    });

    function loop() {
      // Move Ball
      bX += bVx;
      bY += bVy;

      if (bY <= 0 || bY >= c.height) bVy = -bVy;

      // AI Paddle Follow
      const target = bY - pH / 2;
      aiY += (target - aiY) * 0.085;

      // Collision Player
      if (bX <= 25 && bY >= pY && bY <= pY + pH) {
        bVx = -bVx * 1.05;
        bVy += (Math.random() - 0.5) * 2;
      }

      // Collision AI
      if (bX >= c.width - 25 && bY >= aiY && bY <= aiY + pH) {
        bVx = -bVx * 1.05;
      }

      // Score
      if (bX < 0) {
        aiScore++;
        document.getElementById('aiScore').innerText = aiScore;
        reset();
      } else if (bX > c.width) {
        pScore++;
        document.getElementById('pScore').innerText = pScore;
        reset();
      }

      // Render
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, c.width, c.height);

      // Net
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(c.width / 2, 0);
      ctx.lineTo(c.width / 2, c.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Player Paddle
      ctx.fillStyle = '#00f3ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f3ff';
      ctx.fillRect(15, pY, pW, pH);

      // AI Paddle
      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.fillRect(c.width - 15 - pW, aiY, pW, pH);

      // Ball
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(bX, bY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      requestAnimationFrame(loop);
    }

    function reset() {
      bX = c.width / 2;
      bY = c.height / 2;
      bVx = (Math.random() > 0.5 ? 4 : -4);
      bVy = (Math.random() * 4 - 2);
    }

    loop();
  </script>
</body>
</html>`
  },
  {
    id: 'particles',
    name: '🌌 Parçacık Kozmosu',
    desc: 'Fareye duyarlı 1000 parçacıklı çekim alanı',
    icon: 'sparkles',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #030712; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const mouse = { x: w / 2, y: h / 2, isDown: false };
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    const particles = [];
    for (let i = 0; i < 600; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2 + 1,
        color: i % 2 === 0 ? '#38bdf8' : '#a855f7'
      });
    }

    function animate() {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.2)';
      ctx.fillRect(0, 0, w, h);

      particles.forEach((p) => {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 220) {
          const force = (220 - dist) / 220;
          p.vx += (dx / dist) * force * 0.45;
          p.vy += (dy / dist) * force * 0.45;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }
    animate();
  </script>
</body>
</html>`
  },
  {
    id: 'cube',
    name: '🎲 3D Dönen Renkli Küp',
    desc: 'HTML5 Canvas üzerinde saf 3D matris rotasyonu',
    icon: 'box',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #070b19; display: flex; align-items: center; justify-content: center; height: 100vh; overflow: hidden; }
    canvas { background: transparent; }
  </style>
</head>
<body>
  <canvas id="c" width="500" height="500"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const nodes = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];

    let rotX = 0, rotY = 0;

    function render() {
      ctx.clearRect(0, 0, 500, 500);
      rotX += 0.015;
      rotY += 0.02;

      const projected = nodes.map(([x, y, z]) => {
        // Rotate Y
        let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
        let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
        // Rotate X
        let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);

        const fov = 350;
        const scale = fov / (fov + z2 * 100);
        return [x1 * 100 * scale + 250, y1 * 100 * scale + 250];
      });

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#06b6d4';

      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
      });

      projected.forEach(([px, py]) => {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(render);
    }
    render();
  </script>
</body>
</html>`
  },
  {
    id: 'matrix',
    name: '💻 Matrix Dijital Yağmur',
    desc: 'Neo-Tokyo Matrix yeşil kod akışı',
    icon: 'terminal',
    code: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="c"></canvas>
  <script>
    const c = document.getElementById('c');
    const ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトSIGMAGAMES';
    const fontSize = 14;
    const columns = Math.floor(c.width / fontSize);
    const drops = Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, c.width, c.height);

      ctx.fillStyle = '#10b981';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > c.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }
    setInterval(draw, 33);
  </script>
</body>
</html>`
  }
];

export const CodeSandbox: React.FC<{ onSendToChat?: (text: string) => void }> = ({ onSendToChat }) => {
  const [activeTemplate, setActiveTemplate] = useState<string>(TEMPLATES[0].id);
  const [currentCode, setCurrentCode] = useState<string>(TEMPLATES[0].code);
  const [executedCode, setExecutedCode] = useState<string>(TEMPLATES[0].code);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSelectTemplate = (tmpl: CodeTemplate) => {
    setActiveTemplate(tmpl.id);
    setCurrentCode(tmpl.code);
    setExecutedCode(tmpl.code);
  };

  const handleRun = () => {
    setExecutedCode(currentCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTemplate}_sigma_sandbox.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d18] overflow-y-auto text-slate-100 p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/30">
              <Code2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono flex items-center gap-2">
              CANLI KOD & OYUN SANDBOX
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans border border-emerald-500/30">
                PROTOTYPER
              </span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            HTML5, Canvas ve JavaScript mini uygulamalarını anında kodlayın, canlı oynayın ve test edin.
          </p>
        </div>

        {/* Template Quick Switcher */}
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                activeTemplate === tmpl.id
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {tmpl.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Code Editor (Left) & Live Execution Viewport (Right) */}
      <div className={`grid ${isFullscreen ? 'fixed inset-4 z-50 bg-[#080d18] p-4 rounded-2xl border border-emerald-500/50 shadow-2xl' : 'grid-cols-1 lg:grid-cols-12'} gap-6 items-start`}>
        {/* Left: Code Editor */}
        <div className={`${isFullscreen ? 'hidden' : 'lg:col-span-6'} flex flex-col h-[560px] bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl`}>
          {/* Editor Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-300">index.html (Canlı Düzenlenebilir)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
                title="HTML Dosyası Olarak İndir"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>İndir</span>
              </button>
            </div>
          </div>

          {/* Textarea Code Editor */}
          <textarea
            value={currentCode}
            onChange={(e) => setCurrentCode(e.target.value)}
            spellCheck={false}
            className="flex-1 p-4 bg-slate-950 font-mono text-[12px] leading-relaxed text-slate-200 resize-none focus:outline-none selection:bg-emerald-900 selection:text-emerald-100"
          />

          {/* Editor Actions Footer */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleRun}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Kodu Çalıştır & Güncelle</span>
            </button>

            {onSendToChat && (
              <button
                type="button"
                onClick={() => onSendToChat(`Şu HTML/JS kodunu geliştir ve yeni özellikler ekle:\n\n\`\`\`html\n${currentCode}\n\`\`\``)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sigma AI&apos;dan Özellik İste</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Execution Iframe Viewport */}
        <div className={`${isFullscreen ? 'col-span-12 h-full' : 'lg:col-span-6'} flex flex-col h-[560px] bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl`}>
          {/* Viewport Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-300">CANLI PROJEKSİYON (ISOLATED IFRAME)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExecutedCode(currentCode)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Yeniden Başlat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Iframe */}
          <div className="flex-1 bg-black relative">
            <iframe
              title="Sigma Code Sandbox"
              srcDoc={executedCode}
              sandbox="allow-scripts allow-modals allow-same-origin"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
