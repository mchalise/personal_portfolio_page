/* ============================================================
   Motion state — single source of truth for reduced-motion,
   the user pause toggle, and subscribers (canvas, boot).
   ============================================================ */

type Listener = (allowed: boolean) => void;

const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
const listeners = new Set<Listener>();

let userPaused = readPause();

function readPause(): boolean {
	try {
		return localStorage.getItem("ledger:paused") === "1";
	} catch {
		return false;
	}
}

export function prefersReducedMotion(): boolean {
	return reducedMq.matches;
}

export function motionAllowed(): boolean {
	return !reducedMq.matches && !userPaused;
}

export function onMotionChange(fn: Listener): void {
	listeners.add(fn);
	fn(motionAllowed());
}

export function toggleMotion(): boolean {
	userPaused = !userPaused;
	try {
		localStorage.setItem("ledger:paused", userPaused ? "1" : "0");
	} catch {
		/* storage unavailable — pause just won't persist */
	}
	for (const fn of listeners) fn(motionAllowed());
	return userPaused;
}

reducedMq.addEventListener("change", () => {
	for (const fn of listeners) fn(motionAllowed());
});

/* Header pause/resume control */
export function initMotionToggle(): void {
	const btn = document.getElementById("motion-toggle");
	if (!btn) return;
	const icon = btn.querySelector<HTMLElement>(".mt-icon");
	const label = btn.querySelector<HTMLElement>(".mt-label");

	const sync = () => {
		const paused = !motionAllowed();
		btn.setAttribute("aria-pressed", String(paused));
		if (icon) icon.textContent = paused ? "▶" : "▮▮";
		if (label) label.textContent = paused ? "resume motion" : "pause motion";
	};

	btn.addEventListener("click", () => {
		toggleMotion();
		sync();
	});
	sync();
}
