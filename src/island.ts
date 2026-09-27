/* ============================================================
   The Career Archipelago — a three.js night island.
   Career stops are buildings: hover to label, click (or use
   the overlay buttons) to fly the camera and open the dossier.
   Motion respects prefers-reduced-motion + the pause toggle.
   ============================================================ */
import * as THREE from "three";
import { motionAllowed, onMotionChange } from "./motion";
import { showStatus, toast } from "./status";

const ACCENT = 0x4ff0c1;
const AMBER = 0xffb454;

/* Career stop → camera target + dossier template */
const STOPS: Record<string, { focus: [number, number, number]; view: [number, number, number]; label: string }> = {
	"eb-pearls": { focus: [-26, 3, 4], view: [-32, 12, 26], label: "EB Pearls — Web Developer, 2013" },
	"fgd": { focus: [-13, 4, -7], view: [-20, 13, 16], label: "First Global Data — Software Engineer, 2014" },
	"eepos": { focus: [-1, 4, 9], view: [-6, 12, 32], label: "Eepos IT — InvestReady, 2015" },
	"whitehat": { focus: [11, 3, -3], view: [16, 12, 22], label: "WhiteHat Engineering — Senior Engineer, 2017" },
	"zenledger": { focus: [25, 7, -4], view: [34, 18, 24], label: "ZenLedger — Founding Engineer, 2018" },
};
const HOME = { focus: [0, 2, 0] as THREE.Vector3Tuple, view: [0, 16, 46] as THREE.Vector3Tuple };

/* Clickable meshes → stop id */
const pickables = new Map<THREE.Object3D, string>();

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let island: THREE.Group;

/* Motion state */
let raf = 0;
let allowed = motionAllowed();
let visible = document.visibilityState === "visible";
let elapsed = 0;
let lastFrame = performance.now();
const drifts: Array<{ obj: THREE.Object3D; axis: "x" | "y" | "z"; amp: number; speed: number; phase: number; base: number }> = [];
const spinners: THREE.Object3D[] = [];

/* Lamp spotlights, toggleable */
const lamps: Array<{ light: THREE.SpotLight; cone: THREE.Mesh; on: boolean }> = [];
let lampRaf: number | null = null;

/* Camera fly-to tween */
let tween: { from: THREE.Vector3; to: THREE.Vector3; lookFrom: THREE.Vector3; lookTo: THREE.Vector3; t: number; dur: number } | null = null;
const camTarget = new THREE.Vector3(0, 2, 0);

export function initIsland(): void {
	const canvas = document.getElementById("island-canvas");
	if (!(canvas instanceof HTMLCanvasElement)) return;

	renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setClearColor(0x000000, 0);

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x06090a, 0.011);

	camera = new THREE.PerspectiveCamera(50, 1, 0.1, 300);
	camera.position.set(...HOME.view);

	buildLights();
	island = buildIsland();
	scene.add(island);

	sizeToViewport();
	window.addEventListener("resize", sizeToViewport);
	bindPointer(canvas);
	bindOverlayButtons();

	/* Sync rendering with motion state + tab visibility. */
	onMotionChange((next) => {
		allowed = next;
		sync();
	});
	document.addEventListener("visibilitychange", () => {
		visible = document.visibilityState === "visible";
		sync();
	});

	sync();
}

/* ---------- Scene construction ---------- */

function buildLights(): void {
	scene.add(new THREE.AmbientLight(0x334444, 0.9));

	const moon = new THREE.DirectionalLight(0x9fd8c8, 0.7);
	moon.position.set(-30, 50, -20);
	scene.add(moon);

	// Warm rim from behind the citadel
	const rim = new THREE.PointLight(AMBER, 40, 90, 1.8);
	rim.position.set(28, 14, -18);
	scene.add(rim);
}

function mat(color: number, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshStandardMaterial {
	return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness: 0.85, metalness: 0.1 });
}

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
	const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
	m.position.set(x, y, z);
	return m;
}

/** Glowing window strip on a building face. */
function windows(parent: THREE.Mesh, w: number, h: number, d: number, color: number): void {
	const rows = Math.max(1, Math.floor(h / 1.6));
	const cols = Math.max(1, Math.floor(w / 1.7));
	const g = new THREE.PlaneGeometry(0.42, 0.55);
	const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
	const group = new THREE.Group();
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			if (Math.random() < 0.25) continue; // some dark windows
			const win = new THREE.Mesh(g, m);
			win.position.set(-w / 2 + (c + 0.5) * (w / cols), -h / 2 + (r + 0.5) * (h / rows), d / 2 + 0.02);
			group.add(win);
		}
	}
	parent.add(group);
}

function registerStop(mesh: THREE.Object3D, stopId: string): void {
	mesh.userData.stopId = stopId;
	pickables.set(mesh, stopId);
	mesh.traverse((child) => {
		if (child !== mesh) pickables.set(child, stopId);
	});
}

function building(stopId: string, opts: { x: number; z: number; w: number; h: number; d: number; color: number; glow?: number; label?: string }): THREE.Group {
	const g = new THREE.Group();
	const body = box(opts.w, opts.h, opts.d, mat(opts.color, opts.glow ?? 0x000000, opts.glow ? 0.35 : 0), 0, opts.h / 2, 0);
	body.castShadow = false;
	g.add(body);
	if (opts.glow) windows(body, opts.w, opts.h, opts.d, opts.glow);
	// Roof beacon
	const beacon = new THREE.Mesh(
		new THREE.SphereGeometry(0.28, 12, 12),
		new THREE.MeshBasicMaterial({ color: opts.glow ?? ACCENT }),
	);
	beacon.position.y = opts.h + 0.28;
	g.add(beacon);
	spinners.push(beacon);

	g.position.set(opts.x, 0, opts.z);
	registerStop(g, stopId);
	island?.add(g);
	return g;
}

function path(a: [number, number], b: [number, number]): void {
	const [x1, z1] = a;
	const [x2, z2] = b;
	const len = Math.hypot(x2 - x1, z2 - z1);
	const geo = new THREE.BoxGeometry(len, 0.14, 1.9);
	const walk = new THREE.Mesh(geo, mat(0x1b2a2b));
	walk.position.set((x1 + x2) / 2, 0.07, (z1 + z2) / 2);
	walk.lookAt(new THREE.Vector3(x2, 0.07, z2));
	island?.add(walk);
}

function lamppost(x: number, z: number, key: "left" | "right"): void {
	const g = new THREE.Group();
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 4.2, 6), mat(0x223031));
	pole.position.y = 2.1;
	g.add(pole);
	const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a1 }));
	bulb.position.y = 4.3;
	g.add(bulb);

	const light = new THREE.SpotLight(0xffc98a, 60, 18, Math.PI / 5, 0.5, 1.6);
	light.position.y = 4.2;
	light.target.position.set(0, 0, 0);
	g.add(light);
	g.add(light.target);

	// Soft ground pool
	const pool = new THREE.Mesh(
		new THREE.CircleGeometry(3.4, 20),
		new THREE.MeshBasicMaterial({ color: 0x8a6a3a, transparent: true, opacity: 0.22 }),
	);
	pool.rotation.x = -Math.PI / 2;
	pool.position.y = 0.02;
	g.add(pool);

	const entry = { light, cone: pool, on: true };
	lamps.push(entry);

	g.position.set(x, 0, z);
	island?.add(g);

	/* Overlay toggle button drives this lamp */
	const btn = document.getElementById(key === "left" ? "egg-lamp-left" : "egg-lamp-right");
	if (btn) {
		btn.addEventListener("click", () => {
			entry.on = !entry.on;
			btn.setAttribute("aria-pressed", String(entry.on));
			applyLamp(entry);
			showStatus(entry.on ? "Lamppost on" : "Lamppost off");
		});
		applyLamp(entry);
	}
}

function applyLamp(l: { light: THREE.SpotLight; cone: THREE.Mesh; on: boolean }): void {
	l.light.intensity = l.on ? 60 : 0;
	(l.cone.material as THREE.MeshBasicMaterial).opacity = l.on ? 0.22 : 0;
}

function buildIsland(): THREE.Group {
	const root = new THREE.Group();

	/* Bedrock: two stacked low-poly slabs */
	const base = new THREE.Mesh(new THREE.CylinderGeometry(34, 39, 3.2, 7), mat(0x0d1517));
	base.position.y = -1.6;
	const under = new THREE.Mesh(new THREE.CylinderGeometry(39, 26, 7, 7), mat(0x080d0f));
	under.position.y = -6.6;
	root.add(base, under);

	/* Grass crust */
	const crust = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 0.5, 7), mat(0x123028, 0x0a1f1a, 0.25));
	crust.position.y = 0.25;
	root.add(crust);

	/* Career buildings (older → newer, left → right) */
	root.add(building("eb-pearls", { x: -26, z: 4, w: 4, h: 6, d: 4, color: 0x2a3c3a, glow: ACCENT }));
	root.add(building("fgd", { x: -13, z: -7, w: 4.6, h: 8, d: 4.2, color: 0x24343c, glow: ACCENT }));
	root.add(building("eepos", { x: -1, z: 9, w: 5, h: 8, d: 5, color: 0x39301f, glow: AMBER }));
	root.add(building("whitehat", { x: 11, z: -3, w: 6, h: 6, d: 6, color: 0x26343a, glow: ACCENT }));

	/* ZenLedger citadel: stacked tiers + label plaque */
	const zl = new THREE.Group();
	const tiers: Array<[number, number]> = [[8, 6], [6.4, 5], [4.8, 4.4]];
	let ty = 0;
	for (const [w, h] of tiers) {
		zl.add(box(w, h, w, mat(0x1e3a34, 0x0d241f, 0.5), 0, ty + h / 2, 0));
		ty += h;
	}
	const spire = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3, 6), mat(0x123028, ACCENT, 0.4));
	spire.position.y = ty + 1.5;
	zl.add(spire);
	// Orbiting exchange rings (100+ integrations)
	for (const [r, tilt, speed] of [[6.4, 0.32, 0.25], [7.8, -0.22, -0.18]] as const) {
		const ring = new THREE.Mesh(
			new THREE.TorusGeometry(r, 0.06, 8, 64),
			new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 }),
		);
		ring.position.y = ty - 1;
		ring.rotation.x = Math.PI / 2 + tilt;
		ring.userData.spin = speed;
		zl.add(ring);
		spinners.push(ring);
	}
	zl.position.set(25, 0, -4);
	registerStop(zl, "zenledger");
	root.add(zl);

	/* BATS federal lab — separated annex behind the citadel */
	const bats = building("zenledger", { x: 30, z: 12, w: 5, h: 4.6, d: 5, color: 0x33241a, glow: AMBER });
	bats.userData.stopId = "zenledger";

	/* Paths stitching the island together */
	path([-26, 4], [-13, -7]);
	path([-13, -7], [-1, 9]);
	path([-1, 9], [11, -3]);
	path([11, -3], [25, -4]);
	path([25, -4], [30, 12]);

	/* Lampposts (toggleable) */
	lamppost(-7, 1, "left");
	lamppost(18, 5, "right");

	/* Bell tower easter egg */
	const bell = new THREE.Group();
	bell.add(box(1.6, 3.2, 1.6, mat(0x1c2a2c), 0, 1.6, 0));
	const bellDome = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.4, 4), mat(0x1c2a2c, AMBER, 0.3));
	bellDome.position.y = 3.9;
	bell.add(bellDome);
	const bellBody = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 8), mat(0x8a6a3a, 0x503c1c, 0.6));
	bellBody.position.y = 3.1;
	bell.add(bellBody);
	bell.position.set(-8, 0, -12);
	bell.userData.isBell = true;
	pickables.set(bell, "__bell");
	bell.traverse((c) => pickables.set(c, "__bell"));
	root.add(bell);

	/* Low-poly conifers for texture */
	for (const [x, z] of [[-20, -8], [-17, 12], [-5, -4], [4, 12], [16, 9], [24, 12], [-30, -4], [34, -2]] as const) {
		const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1, 5), mat(0x1c2620));
		trunk.position.set(x, 0.9, z);
		const cone = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.6, 6), mat(0x14352c, 0x0a1f18, 0.4));
		cone.position.set(x, 2.7, z);
		root.add(trunk, cone);
	}

	/* Fireflies — drifting accent motes */
	const fireflyGeo = new THREE.BufferGeometry();
	const N = 90;
	const pos = new Float32Array(N * 3);
	for (let i = 0; i < N; i++) {
		pos[i * 3] = (Math.random() - 0.5) * 76;
		pos[i * 3 + 1] = 1 + Math.random() * 12;
		pos[i * 3 + 2] = (Math.random() - 0.5) * 76;
	}
	fireflyGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
	const fireflies = new THREE.Points(
		fireflyGeo,
		new THREE.PointsMaterial({ color: ACCENT, size: 0.28, transparent: true, opacity: 0.75, sizeAttenuation: true }),
	);
	fireflies.userData.isFireflies = true;
	root.add(fireflies);

	drifts.push({ obj: fireflies, axis: "y", amp: 0.9, speed: 0.5, phase: 0, base: 0 });

	/* Gentle island breathing */
	drifts.push({ obj: root, axis: "y", amp: 0.18, speed: 0.4, phase: 1.2, base: 0 });

	return root;
}

/* ---------- Sizing / rendering ---------- */

function sizeToViewport(): void {
	const canvas = renderer.domElement;
	const w = canvas.clientWidth || window.innerWidth;
	const h = canvas.clientHeight || window.innerHeight;
	renderer.setSize(w, h, false);
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
}

function tick(): void {
	raf = 0;
	if (!allowed || !visible) return;

	const dt = Math.min((performance.now() - lastFrame) / 1000, 0.05);
	lastFrame = performance.now();
	elapsed += dt;
	const t = elapsed;

	for (const d of drifts) d.obj.position[d.axis] = d.base + Math.sin(t * d.speed * Math.PI * 2 + d.phase) * d.amp;

	for (const s of spinners) {
		if (s.userData.spin !== undefined) s.rotation.z += s.userData.spin * dt;
		else s.position.y += Math.sin(t * 2 + s.position.x) * 0.002;
	}

	/* Camera tween */
	if (tween) {
		tween.t = Math.min(1, tween.t + dt / tween.dur);
		const e = easeInOut(tween.t);
		camera.position.lerpVectors(tween.from, tween.to, e);
		camTarget.lerpVectors(tween.lookFrom, tween.lookTo, e);
		camera.lookAt(camTarget);
		if (tween.t >= 1) tween = null;
	} else {
		camera.lookAt(camTarget);
	}

	renderer.render(scene, camera);
	raf = requestAnimationFrame(tick);
}

function sync(): void {
	if (allowed && visible) {
		if (!raf) {
			lastFrame = performance.now(); // absorb the pause gap so nothing jumps
			raf = requestAnimationFrame(tick);
		}
	} else {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		if (scene && camera) {
			camera.lookAt(camTarget);
			renderer.render(scene, camera); // settle on a static frame
		}
	}
}

function easeInOut(p: number): number {
	return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
}

/* ---------- Pointer picking ---------- */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered: string | null = null;
let downAt: { x: number; y: number; t: number } | null = null;

function bindPointer(canvas: HTMLCanvasElement): void {
	canvas.addEventListener("pointermove", (e) => {
		const rect = canvas.getBoundingClientRect();
		pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObjects([...pickables.keys()], false);
		const id = hits.length ? pickables.get(hits[0].object) ?? null : null;
		if (id !== hovered) {
			hovered = id;
			canvas.style.cursor = id ? "pointer" : "";
			if (id && id !== "__bell") {
				const stop = STOPS[id];
				if (stop) showStatus(stop.label);
			} else if (id === "__bell") {
				showStatus("Island bell — click to ring");
			} else if (!id) {
				showStatus("Interactive map ready");
			}
		}
	});

	canvas.addEventListener("pointerdown", (e) => {
		downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
	});

	canvas.addEventListener("pointerup", (e) => {
		if (!downAt) return;
		const dx = e.clientX - downAt.x;
		const dy = e.clientY - downAt.y;
		const dtms = performance.now() - downAt.t;
		downAt = null;
		if (Math.hypot(dx, dy) > 6 || dtms > 400) return; // drag or long-press → not a click
		const rect = canvas.getBoundingClientRect();
		pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointer, camera);
		const hits = raycaster.intersectObjects([...pickables.keys()], false);
		const id = hits.length ? pickables.get(hits[0].object) : null;
		if (!id) return;
		if (id === "__bell") ringBell();
		else flyToStop(id);
	});
}

/* ---------- Camera + overlay wiring ---------- */

function flyTo(focus: THREE.Vector3Tuple, view: THREE.Vector3Tuple, dur = 1.4): void {
	tween = {
		from: camera.position.clone(),
		to: new THREE.Vector3(...view),
		lookFrom: camTarget.clone(),
		lookTo: new THREE.Vector3(...focus),
		t: 0,
		dur: allowed ? dur : 0,
	};
	if (!allowed) {
		// Snap instantly when motion is paused.
		camera.position.copy(tween.to);
		camTarget.copy(tween.lookTo);
		tween = null;
		renderer.render(scene, camera);
	}
}

function flyToStop(stopId: string, openDossier = true): void {
	const stop = STOPS[stopId];
	if (!stop) return;
	showStatus(`Flying to ${stop.label}`);
	flyTo(stop.focus, stop.view);
	if (openDossier) {
		window.setTimeout(() => openStopDossier(stopId), allowed ? 900 : 0);
	}
}

function openStopDossier(stopId: string): void {
	document.dispatchEvent(new CustomEvent("island:open-dossier", { detail: stopId }));
}

function bindOverlayButtons(): void {
	document.querySelectorAll<HTMLButtonElement>("[data-stop]").forEach((btn) => {
		const id = btn.dataset.stop ?? "";
		btn.addEventListener("click", () => flyToStop(id));
	});

	document.getElementById("view-reset")?.addEventListener("click", () => {
		flyTo(HOME.focus, HOME.view);
		showStatus("View reset — whole island visible");
	});

	const bellBtn = document.getElementById("egg-bell");
	bellBtn?.addEventListener("click", ringBell);
}

function ringBell(): void {
	const bellBtn = document.getElementById("egg-bell");
	bellBtn?.classList.add("is-ringing");
	window.setTimeout(() => bellBtn?.classList.remove("is-ringing"), 600);

	// Pulse the ring meshes as the "sound"
	for (const s of spinners) {
		if (s.userData.spin !== undefined) {
			const start = performance.now();
			const bump = () => {
				const p = (performance.now() - start) / 900;
				if (p >= 1) {
					s.scale.setScalar(1);
					return;
				}
				s.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.35);
				lampRaf = requestAnimationFrame(bump);
			};
			bump();
		}
	}
	toast("BELL", "Island bell rung", "Twelve years of shipping — that's the sound.", "🔔 on the hill");
	showStatus("Bell rung — hear that? That's the last twelve years.");
}

/* Cleanup safety for the ring pulse animation frame */
export function disposeIsland(): void {
	if (raf) cancelAnimationFrame(raf);
	if (lampRaf) cancelAnimationFrame(lampRaf);
	renderer?.dispose();
}
