/* ============================================================
   Shared global canvas — a live hash-linked chain drifting
   behind the page. Packets flow block → block. Static frame
   when motion is off or the tab is hidden.
   ============================================================ */
import { motionAllowed, onMotionChange } from "./motion";

interface BlockNode {
	x: number;
	y: number;
	w: number;
	h: number;
	amber: boolean;
	drift: number;
}

interface Packet {
	edge: number; // index of node pair (i → i+1)
	t: number; // 0..1 along the L-path
	speed: number;
}

const ACCENT = "79, 240, 193";
const AMBER = "255, 180, 84";

export function initCanvas(): void {
	const el = document.getElementById("chain-canvas");
	if (!(el instanceof HTMLCanvasElement)) return;
	// Rebind so the (non-null) types survive into nested function declarations.
	const canvas: HTMLCanvasElement = el;
	const maybeCtx = canvas.getContext("2d");
	if (!maybeCtx) return;
	const ctx: CanvasRenderingContext2D = maybeCtx;

	let width = 0;
	let height = 0;
	let nodes: BlockNode[] = [];
	let packets: Packet[] = [];
	let raf = 0;
	let allowed = motionAllowed();
	let visible = document.visibilityState === "visible";

	const rand = (min: number, max: number) => min + Math.random() * (max - min);

	function layout(): void {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const small = width < 760;
		const count = small ? 8 : 14;
		nodes = Array.from({ length: count }, () => {
			const w = rand(46, 96);
			return {
				x: rand(20, Math.max(21, width - w - 20)),
				y: rand(30, Math.max(31, height - 70)),
				w,
				h: rand(24, 38),
				amber: Math.random() < 0.14,
				drift: rand(0.06, 0.22) * (Math.random() < 0.5 ? -1 : 1),
			};
		});
		// Sort left→right so the chain reads as a chain.
		nodes.sort((a, b) => a.x - b.x);

		packets = nodes.slice(0, -1).map((_, i) => ({
			edge: i,
			t: Math.random(),
			speed: rand(0.0016, 0.0042),
		}));
		draw();
	}

	/* L-shaped path from node i to node i+1 (via a corner), like a PCB trace. */
	function edgePoints(i: number): { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number } {
		const a = nodes[i];
		const b = nodes[i + 1];
		const x0 = a.x + a.w;
		const y0 = a.y + a.h / 2;
		const x1 = b.x;
		const y1 = b.y + b.h / 2;
		return { x0, y0, cx: (x0 + x1) / 2, cy: y0, x1, y1 };
	}

	function pointAt(p: ReturnType<typeof edgePoints>, t: number): { x: number; y: number } {
		const seg1 = Math.abs(p.cx - p.x0);
		const seg2 = Math.abs(p.y1 - p.cy);
		const total = seg1 + seg2 || 1;
		const d = t * total;
		if (d <= seg1) {
			const dir = p.cx >= p.x0 ? 1 : -1;
			return { x: p.x0 + dir * d, y: p.y0 };
		}
		const dirY = p.y1 >= p.cy ? 1 : -1;
		return { x: p.cx, y: p.cy + dirY * (d - seg1) };
	}

	function draw(): void {
		ctx.clearRect(0, 0, width, height);

		// Edges (block → block links)
		ctx.lineWidth = 1;
		ctx.strokeStyle = `rgba(${ACCENT}, 0.10)`;
		for (let i = 0; i < nodes.length - 1; i++) {
			const p = edgePoints(i);
			ctx.beginPath();
			ctx.moveTo(p.x0, p.y0);
			ctx.lineTo(p.cx, p.cy);
			ctx.lineTo(p.x1, p.y1);
			ctx.stroke();
		}

		// Packets (proposed hashes flowing along the chain)
		for (const pk of packets) {
			const p = edgePoints(pk.edge);
			const pt = pointAt(p, pk.t);
			ctx.beginPath();
			ctx.arc(pt.x, pt.y, 2.4, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${ACCENT}, 0.85)`;
			ctx.shadowColor = `rgba(${ACCENT}, 0.8)`;
			ctx.shadowBlur = 8;
			ctx.fill();
			ctx.shadowBlur = 0;
		}

		// Blocks
		for (const n of nodes) {
			const rgb = n.amber ? AMBER : ACCENT;
			const r = 5;
			ctx.beginPath();
			ctx.roundRect(n.x, n.y, n.w, n.h, r);
			ctx.fillStyle = "rgba(10, 15, 17, 0.9)";
			ctx.fill();
			ctx.strokeStyle = `rgba(${rgb}, 0.35)`;
			ctx.stroke();
			// leading accent tick, like the block cards
			ctx.fillStyle = `rgba(${rgb}, 0.75)`;
			ctx.fillRect(n.x + 5, n.y + 6, 2, n.h - 12);
			// "hash" dashes
			ctx.fillStyle = `rgba(${rgb}, 0.28)`;
			for (let d = 0; d < 4; d++) {
				const dw = n.w - 22 - d * 8;
				if (dw <= 0) break;
				ctx.fillRect(n.x + 13, n.y + 9 + d * 6, Math.max(10, dw * 0.6), 2);
			}
		}
	}

	function tick(): void {
		raf = 0;
		if (!allowed || !visible) return;

		for (const n of nodes) {
			n.y += n.drift * 0.35;
			if (n.y < 18 || n.y > height - 70) n.drift *= -1;
		}
		for (const pk of packets) {
			pk.t += pk.speed;
			if (pk.t > 1) pk.t = 0;
		}
		draw();
		raf = requestAnimationFrame(tick);
	}

	function sync(): void {
		if (allowed && visible) {
			if (!raf) raf = requestAnimationFrame(tick);
		} else {
			if (raf) cancelAnimationFrame(raf);
			raf = 0;
			draw(); // settle on a static frame
		}
	}

	onMotionChange((next) => {
		allowed = next;
		sync();
	});

	document.addEventListener("visibilitychange", () => {
		visible = document.visibilityState === "visible";
		sync();
	});

	let resizeTimer = 0;
	window.addEventListener("resize", () => {
		window.clearTimeout(resizeTimer);
		resizeTimer = window.setTimeout(layout, 150);
	});

	layout();
	sync();
}
