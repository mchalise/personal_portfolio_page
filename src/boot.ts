/* ============================================================
   Boot sequence — ~1.4s island survey, skippable (esc / click),
   skipped entirely under prefers-reduced-motion.
   ============================================================ */
import { prefersReducedMotion } from "./motion";

const LINES: Array<{ text: string; cls: string }> = [
	{ text: "$ island survey --archipelago mchalise", cls: "" },
	{ text: "» scanning coastlines 2013 → 2025 …", cls: "dim" },
	{ text: "» 6 career stops charted · 1 live product", cls: "" },
	{ text: "» federal annex located (clearance verified) ✓", cls: "dim" },
	{ text: "» lampposts lit · bell armed", cls: "" },
	{ text: "» landing craft ready ▸", cls: "warn" },
];

export function initBoot(): void {
	const boot = document.getElementById("boot");
	if (!boot) return;
	const log = boot.querySelector<HTMLElement>(".boot-log");
	if (!log) return;

	// Reduced motion (or an interrupted session) → no boot theatrics.
	if (prefersReducedMotion() || sessionStorage.getItem("island:booted") === "1") {
		boot.remove();
		return;
	}
	sessionStorage.setItem("island:booted", "1");

	let i = 0;
	let timer = 0;
	let done = false;

	const finish = () => {
		if (done) return;
		done = true;
		window.clearTimeout(timer);
		boot.classList.add("is-done");
		boot.setAttribute("aria-hidden", "true");
		document.removeEventListener("keydown", onKey);
		window.setTimeout(() => boot.remove(), 700);
	};

	const onKey = (e: KeyboardEvent) => {
		if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish();
	};

	const step = () => {
		if (done) return;
		const line = LINES[i];
		const el = document.createElement("span");
		el.className = line.cls;
		el.textContent = line.text + "\n";
		log.appendChild(el);
		i++;
		if (i < LINES.length) {
			timer = window.setTimeout(step, 140);
		} else {
			timer = window.setTimeout(finish, 420);
		}
	};

	document.addEventListener("keydown", onKey);
	boot.addEventListener("click", finish);
	boot.querySelector(".boot-skip")?.addEventListener("click", finish);

	timer = window.setTimeout(step, 140);
}
