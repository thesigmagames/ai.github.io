import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Shield,
  Sparkles,
  Maximize2,
  Eye,
  Sliders,
  Play,
  Pause,
  Trash2,
  ChevronDown,
  Layers,
  Flame,
  Award
} from 'lucide-react';

interface HighScoreData {
  score: number;
  cores: number;
  distance: number;
  date: string;
}

export const ThreeGameStudio: React.FC<{ onSendToChat?: (text: string) => void }> = ({ onSendToChat }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Game States: 'title' | 'playing' | 'gameover' | 'inspect'
  const [gameState, setGameState] = useState<'title' | 'playing' | 'gameover' | 'inspect'>('title');
  const [score, setScore] = useState(0);
  const [coresCollected, setCoresCollected] = useState(0);
  const [shieldHealth, setShieldHealth] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const [isBoosting, setIsBoosting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [highScore, setHighScore] = useState<HighScoreData>(() => {
    try {
      const s = localStorage.getItem('sigma_cyber_runner_highscore_v1');
      if (s) return JSON.parse(s);
    } catch {}
    return { score: 0, cores: 0, distance: 0, date: '' };
  });

  // Sound Synth Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Three.js Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const shipGroupRef = useRef<THREE.Group | null>(null);
  const obstaclesRef = useRef<THREE.Mesh[]>([]);
  const energyCoresRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animIdRef = useRef<number | null>(null);
  const keysRef = useRef<{ [key: string]: boolean }>({});

  // Game tracking variables inside ref for 60fps loop
  const gameLoopVars = useRef({
    playerX: 0,
    playerY: 0,
    playerRoll: 0,
    speed: 55,
    distance: 0,
    score: 0,
    cores: 0,
    shield: 100,
    multiplier: 1,
    boosting: false,
    cameraShake: 0,
    lastObstacleSpawn: 0,
    lastCoreSpawn: 0
  });

  // Sound Synthesizer via Web Audio API
  const playSound = (type: 'laser' | 'core' | 'hit' | 'boost' | 'gameover') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'core') {
        // High crystal chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'hit') {
        // Low distorted hit
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'boost') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(55, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch {}
  };

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.code === 'Space') {
        gameLoopVars.current.boosting = true;
        setIsBoosting(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      if (e.code === 'Space') {
        gameLoopVars.current.boosting = false;
        setIsBoosting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Three.js Scene Setup with Procedural Models & Studio PBR Environment
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.012);
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 800);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 1, -15);
    cameraRef.current = camera;

    // 2. WebGL Renderer with ACES Filmic Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Studio PBR Environment via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGenerator.fromScene(roomEnv).texture;

    // 4. Lights: Key directional + Cyan & Magenta Cyber Rim Lights
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const cyanRim = new THREE.PointLight(0x00f0ff, 3.5, 45);
    cyanRim.position.set(-8, 3, 2);
    scene.add(cyanRim);

    const magentaRim = new THREE.PointLight(0xff0077, 3.5, 45);
    magentaRim.position.set(8, 3, 2);
    scene.add(magentaRim);

    // 5. Procedural Tech Texture for Hull (Zero 404s)
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d')!;
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
    const techTexture = new THREE.CanvasTexture(textureCanvas);
    techTexture.wrapS = THREE.RepeatWrapping;
    techTexture.wrapT = THREE.RepeatWrapping;
    techTexture.repeat.set(2, 2);

    // 6. Multi-Part Composite Procedural Spaceship (3–12 parts in THREE.Group)
    const ship = new THREE.Group();

    // Part 1: Main Fuselage / Cockpit
    const fuselageGeo = new THREE.ConeGeometry(1.2, 5.5, 8);
    fuselageGeo.rotateX(Math.PI / 2);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      map: techTexture
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    ship.add(fuselage);

    // Part 2: Canopy Glass (Emissive Cyan)
    const canopyGeo = new THREE.SphereGeometry(0.75, 16, 16);
    canopyGeo.scale(1, 0.6, 2.2);
    const canopyMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0088aa,
      emissiveIntensity: 0.8,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.set(0, 0.5, -0.2);
    ship.add(canopy);

    // Part 3 & 4: Swept Wings (Left & Right)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(3.2, -1.8);
    wingShape.lineTo(3.0, -2.8);
    wingShape.lineTo(0, -1.8);
    wingShape.closePath();

    const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 };
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
    wingGeo.rotateX(-Math.PI / 2);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.3
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(0.6, 0, 0);
    ship.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.scale.set(-1, 1, 1);
    rightWing.position.set(-0.6, 0, 0);
    ship.add(rightWing);

    // Part 5 & 6: Twin Jet Engine Thrusters
    const thrusterGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.8, 12);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.95, roughness: 0.15 });

    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(0.9, -0.1, 1.6);
    ship.add(leftThruster);

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    rightThruster.position.set(-0.9, -0.1, 1.6);
    ship.add(rightThruster);

    // Part 7 & 8: Glowing Plasma Thruster Flame Cones
    const flameGeo = new THREE.ConeGeometry(0.3, 1.2, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const leftFlame = new THREE.Mesh(flameGeo, flameMat);
    leftFlame.position.set(0.9, -0.1, 2.8);
    ship.add(leftFlame);

    const rightFlame = new THREE.Mesh(flameGeo, flameMat);
    rightFlame.position.set(-0.9, -0.1, 2.8);
    ship.add(rightFlame);

    ship.position.set(0, 0.8, 0);
    scene.add(ship);
    shipGroupRef.current = ship;

    // 7. Cyber Canyon Road & Neon Side Rails
    const roadGeo = new THREE.PlaneGeometry(28, 600, 20, 20);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x050a17,
      metalness: 0.7,
      roughness: 0.4,
      map: techTexture
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(0, -0.5, -200);
    scene.add(road);

    // Glowing Neon Rails (Left & Right)
    const railGeo = new THREE.BoxGeometry(0.4, 0.4, 600);
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-14, 0, -200);
    scene.add(leftRail);

    const rightRail = new THREE.Mesh(railGeo, new THREE.MeshBasicMaterial({ color: 0xff0077 }));
    rightRail.position.set(14, 0, -200);
    scene.add(rightRail);

    // 8. Warp Speed Starfield Particles
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 80;
      starPos[i + 1] = Math.random() * 40 - 2;
      starPos[i + 2] = -Math.random() * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.8, transparent: true, opacity: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    particlesRef.current = starField;

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. 60 FPS Game Loop
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const g = gameLoopVars.current;

      // Handle Inputs in Playing State
      if (gameState === 'playing') {
        const keys = keysRef.current;
        const moveSpeed = 22 * delta;

        if (keys['arrowleft'] || keys['a']) {
          g.playerX = Math.max(g.playerX - moveSpeed, -12);
          g.playerRoll = THREE.MathUtils.lerp(g.playerRoll, 0.45, 0.15);
        } else if (keys['arrowright'] || keys['d']) {
          g.playerX = Math.min(g.playerX + moveSpeed, 12);
          g.playerRoll = THREE.MathUtils.lerp(g.playerRoll, -0.45, 0.15);
        } else {
          g.playerRoll = THREE.MathUtils.lerp(g.playerRoll, 0, 0.1);
        }

        if (keys['arrowup'] || keys['w']) {
          g.playerY = Math.min(g.playerY + moveSpeed * 0.6, 6);
        } else if (keys['arrowdown'] || keys['s']) {
          g.playerY = Math.max(g.playerY - moveSpeed * 0.6, 0.2);
        }

        // Apply Position and Rotation to Ship
        if (ship) {
          ship.position.x = g.playerX;
          ship.position.y = g.playerY + 0.8;
          ship.rotation.z = g.playerRoll;
          ship.rotation.y = -g.playerRoll * 0.5;

          // Engine flame pulse
          const flameScale = g.boosting ? 2.2 + Math.random() * 0.5 : 1.0 + Math.sin(currentTime * 0.02) * 0.3;
          leftFlame.scale.set(flameScale, flameScale, flameScale);
          rightFlame.scale.set(flameScale, flameScale, flameScale);
        }

        // Camera Follow with dynamic shake
        if (camera) {
          camera.position.x = THREE.MathUtils.lerp(camera.position.x, g.playerX * 0.65, 0.1);
          camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4 + g.playerY * 0.4, 0.1);

          if (g.cameraShake > 0) {
            camera.position.x += (Math.random() - 0.5) * g.cameraShake;
            camera.position.y += (Math.random() - 0.5) * g.cameraShake;
            g.cameraShake = Math.max(0, g.cameraShake - delta * 3);
          }
        }

        // Forward Progression
        const forwardSpeed = (g.boosting ? g.speed * 1.8 : g.speed) * delta;
        g.distance += forwardSpeed * 0.2;
        g.score += Math.round(forwardSpeed * g.multiplier);

        // Spawn Obstacles (Digital Neon Monoliths)
        if (currentTime - g.lastObstacleSpawn > (g.boosting ? 900 : 1300)) {
          g.lastObstacleSpawn = currentTime;
          const obsGeo = new THREE.BoxGeometry(2.5, Math.random() * 6 + 3, 2.5);
          const obsMat = new THREE.MeshStandardMaterial({
            color: Math.random() > 0.5 ? 0xff0055 : 0x7700ff,
            emissive: 0x330022,
            metalness: 0.8,
            roughness: 0.2
          });
          const obs = new THREE.Mesh(obsGeo, obsMat);
          obs.position.set((Math.random() - 0.5) * 22, obsGeo.parameters.height / 2, -300);
          scene.add(obs);
          obstaclesRef.current.push(obs);
        }

        // Spawn Energy Cores (Rotating Octahedrons)
        if (currentTime - g.lastCoreSpawn > 1800) {
          g.lastCoreSpawn = currentTime;
          const coreGeo = new THREE.OctahedronGeometry(1.0);
          const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.2,
            metalness: 0.2,
            roughness: 0.1
          });
          const core = new THREE.Mesh(coreGeo, coreMat);
          core.position.set((Math.random() - 0.5) * 20, Math.random() * 4 + 1, -300);
          scene.add(core);
          energyCoresRef.current.push(core);
        }

        // Update Obstacles Movement & Collision Check
        for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
          const obs = obstaclesRef.current[i];
          obs.position.z += forwardSpeed;

          // Check Collision with Ship
          if (Math.abs(obs.position.z - ship.position.z) < 2.5) {
            const obsHeight = (obs.geometry as any).parameters?.height || 5;
            if (Math.abs(obs.position.x - ship.position.x) < 2.2 && ship.position.y < obsHeight) {
              // Collision!
              playSound('hit');
              g.cameraShake = 0.8;
              g.shield -= 25;
              g.multiplier = 1;
              scene.remove(obs);
              obstaclesRef.current.splice(i, 1);

              if (g.shield <= 0) {
                // Game Over!
                playSound('gameover');
                setGameState('gameover');
                // Check highscore
                if (g.score > highScore.score) {
                  const newHigh: HighScoreData = {
                    score: g.score,
                    cores: g.cores,
                    distance: Math.round(g.distance),
                    date: new Date().toLocaleDateString()
                  };
                  setHighScore(newHigh);
                  localStorage.setItem('sigma_cyber_runner_highscore_v1', JSON.stringify(newHigh));
                }
              }
              continue;
            }
          }

          if (obs.position.z > 20) {
            scene.remove(obs);
            obstaclesRef.current.splice(i, 1);
          }
        }

        // Update Energy Cores Movement & Collection Check
        for (let i = energyCoresRef.current.length - 1; i >= 0; i--) {
          const core = energyCoresRef.current[i];
          core.position.z += forwardSpeed;
          core.rotation.x += delta * 2;
          core.rotation.y += delta * 3;

          // Check Collection
          const dist = core.position.distanceTo(ship.position);
          if (dist < 2.8) {
            playSound('core');
            g.cores += 1;
            g.score += 500 * g.multiplier;
            g.multiplier = Math.min(g.multiplier + 1, 8);
            g.shield = Math.min(100, g.shield + 10);
            scene.remove(core);
            energyCoresRef.current.splice(i, 1);
            continue;
          }

          if (core.position.z > 20) {
            scene.remove(core);
            energyCoresRef.current.splice(i, 1);
          }
        }

        // Starfield warp movement
        if (particlesRef.current) {
          const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
          for (let i = 2; i < pos.length; i += 3) {
            pos[i] += forwardSpeed * 1.5;
            if (pos[i] > 10) {
              pos[i] = -400;
            }
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Sync React state throttled
        setScore(g.score);
        setCoresCollected(g.cores);
        setShieldHealth(Math.max(0, g.shield));
        setMultiplier(g.multiplier);
      } else if (gameState === 'title' || gameState === 'inspect') {
        // Idle Ship 360 showcase rotation
        if (ship) {
          ship.rotation.y = currentTime * 0.0008;
          ship.rotation.z = Math.sin(currentTime * 0.001) * 0.1;
          ship.position.y = 0.8 + Math.sin(currentTime * 0.002) * 0.3;
        }
      }

      renderer.render(scene, camera);
      animIdRef.current = requestAnimationFrame(animate);
    };

    animIdRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      renderer.dispose();
      pmremGenerator.dispose();
      roomEnv.dispose();
    };
  }, [gameState, isMuted, highScore.score]);

  // Start / Restart Game
  const handleStartGame = () => {
    // Clear old items
    obstaclesRef.current.forEach((o) => sceneRef.current?.remove(o));
    obstaclesRef.current = [];
    energyCoresRef.current.forEach((c) => sceneRef.current?.remove(c));
    energyCoresRef.current = [];

    gameLoopVars.current = {
      playerX: 0,
      playerY: 0,
      playerRoll: 0,
      speed: 55,
      distance: 0,
      score: 0,
      cores: 0,
      shield: 100,
      multiplier: 1,
      boosting: false,
      cameraShake: 0,
      lastObstacleSpawn: performance.now(),
      lastCoreSpawn: performance.now()
    };

    setScore(0);
    setCoresCollected(0);
    setShieldHealth(100);
    setMultiplier(1);
    setGameState('playing');
    playSound('boost');
  };

  // Reset Highscore
  const handleResetHighScore = () => {
    localStorage.removeItem('sigma_cyber_runner_highscore_v1');
    setHighScore({ score: 0, cores: 0, distance: 0, date: '' });
  };

  // Toggle Wireframe for Three.js Inspection
  const toggleWireframe = () => {
    setWireframe(!wireframe);
    if (shipGroupRef.current) {
      shipGroupRef.current.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material.wireframe = !wireframe;
        }
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030611] overflow-hidden text-slate-100 relative">
      {/* Three.js Canvas Container (Takes full viewport) */}
      <div ref={mountRef} className="w-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Top Floating Telemetry & Mode Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 flex items-center gap-2 pointer-events-auto shadow-lg shadow-cyan-950/40">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white tracking-wider">
              SIGMA CYBER RUNNER 3D
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
              THREE.JS PBR
            </span>
          </div>

          {gameState === 'playing' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Kalkan:</span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${shieldHealth}%` }}
                />
              </div>
              <span className="font-bold text-cyan-300">{shieldHealth}%</span>
            </div>
          )}
        </div>

        {/* Right Controls: Audio & Wireframe & High Score */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          <button
            type="button"
            onClick={toggleWireframe}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              wireframe ? 'bg-cyan-600 text-white border-cyan-400' : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Three.js Tel Kafes Modu"
          >
            <span>{wireframe ? 'Mesh' : 'Wireframe'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-1.5 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>En Yüksek: {highScore.score.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* IN-GAME HUD (LOW OCCLUSION) */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between pointer-events-none z-10">
          {/* Score & Multiplier */}
          <div className="bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/40 space-y-1 shadow-2xl pointer-events-auto font-mono">
            <div className="text-[10px] text-slate-400 tracking-wider">SKOR</div>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-2">
              <span>{score.toLocaleString()}</span>
              {multiplier > 1 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/30 text-pink-300 font-bold border border-pink-500/40 animate-pulse">
                  {multiplier}X ÇARPAN
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{coresCollected} Enerji Çekirdeği</span>
              </span>
            </div>
          </div>

          {/* On-Screen Mobile Touch Joystick / Controls */}
          <div className="flex items-center gap-2 pointer-events-auto sm:hidden">
            <button
              type="button"
              onTouchStart={() => (keysRef.current['arrowleft'] = true)}
              onTouchEnd={() => (keysRef.current['arrowleft'] = false)}
              className="w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-bold text-lg active:bg-cyan-600"
            >
              ←
            </button>
            <button
              type="button"
              onTouchStart={() => (keysRef.current['arrowright'] = true)}
              onTouchEnd={() => (keysRef.current['arrowright'] = false)}
              className="w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-bold text-lg active:bg-cyan-600"
            >
              →
            </button>
            <button
              type="button"
              onTouchStart={() => {
                gameLoopVars.current.boosting = true;
                setIsBoosting(true);
              }}
              onTouchEnd={() => {
                gameLoopVars.current.boosting = false;
                setIsBoosting(false);
              }}
              className="w-12 h-12 rounded-xl bg-pink-600 border border-pink-400 text-white font-bold text-xs flex items-center justify-center shadow-lg active:scale-95"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* TITLE SCREEN MODAL */}
      {gameState === 'title' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-20 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center space-y-6 shadow-2xl shadow-cyan-950/60">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30">
              <Gamepad2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                SIGMA CYBER RUNNER 3D
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                The Sigma Games laboratuvarında geliştirilen Three.js motorlu 3D uzay koşucusu. Engellerden kaçın, enerji kürelerini toplayarak kalkanını yenile ve rekor kır!
              </p>
            </div>

            {/* Controls Guide */}
            <div className="grid grid-cols-2 gap-3 text-left bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase">YÖNLENDİRME</span>
                <div className="font-bold text-cyan-300">A / D veya Sol / Sağ Ok</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase">HİPER BOOST</span>
                <div className="font-bold text-pink-300">Space Tuşu (Boşluk)</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>OYUNU BAŞLAT (60 FPS PBR)</span>
              </button>

              <button
                type="button"
                onClick={() => setGameState('inspect')}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Gemi İnceleme & Model Modu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-20 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-6 shadow-2xl shadow-rose-950/60">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white font-mono">GÖREV SONA ERDİ</h2>
              <p className="text-xs text-slate-400">Kalkan tükendi ve gemi hasar aldı.</p>
            </div>

            {/* Scorecard */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-mono">TOPLAM SKOR</div>
                <div className="text-xl font-black text-cyan-400 font-mono">{score.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-mono">TOPLANAN ÇEKİRDEK</div>
                <div className="text-xl font-black text-purple-400 font-mono">{coresCollected}</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-xl shadow-cyan-600/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yeniden Oyna</span>
              </button>

              {onSendToChat && (
                <button
                  type="button"
                  onClick={() => onSendToChat(`Sigma Cyber Runner 3D oyununda ${score} puan aldım ve ${coresCollected} enerji çekirdeği topladım! Bu rekor hakkında beni değerlendir ve The Sigma Games tarzında tebrik et.`)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>💬 Skoru Sohbete Gönder</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetHighScore}
                className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center justify-center gap-1 mx-auto pt-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>En Yüksek Skoru Sıfırla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTOR MODE EXIT BUTTON */}
      {gameState === 'inspect' && (
        <div className="absolute bottom-6 left-6 z-10">
          <button
            type="button"
            onClick={() => setGameState('title')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Oyun Menüsüne Dön</span>
          </button>
        </div>
      )}
    </div>
  );
};
