import { Application, Graphics } from 'pixi.js';

interface Wisp {
  g: Graphics;
  vy: number;
  drift: number;
  phase: number;
}

interface Spark {
  g: Graphics;
  vx: number;
  vy: number;
  life: number;
}

let burstAt: (x: number, y: number, count?: number) => void = () => {};

/** Spawns a burst of soul sparks at screen coordinates. No-op until the stage is created. */
export function burst(x: number, y: number, count = 30): void {
  burstAt(x, y, count);
}

/** Background canvas with drifting soul wisps; later hosts boss fights and effects. */
export async function createStage(canvas: HTMLCanvasElement): Promise<Application> {
  const app = new Application();
  await app.init({
    canvas,
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio, 2),
    autoDensity: true,
  });

  const wisps: Wisp[] = [];
  const spawn = (anyY: boolean): Wisp => {
    const g = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill({ color: 0x6dff9e, alpha: 0.6 });
    g.x = Math.random() * app.screen.width;
    g.y = anyY ? Math.random() * app.screen.height : app.screen.height + 10;
    app.stage.addChild(g);
    return { g, vy: 0.2 + Math.random() * 0.5, drift: 0.3 + Math.random() * 0.7, phase: Math.random() * Math.PI * 2 };
  };
  for (let i = 0; i < 40; i++) wisps.push(spawn(true));

  const sparks: Spark[] = [];
  burstAt = (x, y, count = 30) => {
    for (let i = 0; i < count; i++) {
      const g = new Graphics().circle(0, 0, 1.5 + Math.random() * 2.5).fill({ color: 0x6dff9e });
      g.x = x;
      g.y = y;
      app.stage.addChild(g);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      sparks.push({ g, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.5, life: 1 });
    }
  };

  app.ticker.add((ticker) => {
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.g.x += s.vx * ticker.deltaTime;
      s.g.y += s.vy * ticker.deltaTime;
      s.vy += 0.05 * ticker.deltaTime;
      s.life -= 0.02 * ticker.deltaTime;
      s.g.alpha = Math.max(0, s.life);
      if (s.life <= 0) {
        s.g.destroy();
        sparks.splice(i, 1);
      }
    }
    for (const w of wisps) {
      w.phase += 0.02 * ticker.deltaTime;
      w.g.y -= w.vy * ticker.deltaTime;
      w.g.x += Math.sin(w.phase) * w.drift * 0.3 * ticker.deltaTime;
      w.g.alpha = 0.3 + 0.3 * Math.sin(w.phase * 1.3);
      if (w.g.y < -10) {
        w.g.y = app.screen.height + 10;
        w.g.x = Math.random() * app.screen.width;
      }
    }
  });

  return app;
}
