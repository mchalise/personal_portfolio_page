/* ============================================================
   Boot sequence — ~1.5s console init, skippable (esc / click),
   skipped entirely under prefers-reduced-motion.
   ============================================================ */
import { prefersReducedMotion } from "./motion";

const LINES: Array<{ text: string; cls: string }> = [
	{ text: "$ ledger verify --chain mchalise", cls: "" },
	{ text: "» genesis hash 00000000…a1f3 found", cls: "dim" },
	{ text: "» linking blocks 2013 → 2025 …", cls: "" },
	{ text: "» 6 blocks linked · 0 orphans", cls: "dim" },
	{ text: "» case files decrypted ✓", cls: "" },
	{ text: "» forensic console ready ▸", cls: "warn" },
];

export function initBoot(): void {
	const boot = document.getElementById("boot");
	const log = document.getElementById("boot-log");
	if (!boot || !log) return;

	// Reduced motion (or an interrupted session) → no boot theatrics.
	if (prefersReducedMotion() || sessionStorage.getItem("ledger:booted") === "1") {
		boot.remove();
		return;
	}
	sessionStorage.setItem("ledger:booted", "1");

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
			timer = window.setTimeout(step, 150);
		} else {
			timer = window.setTimeout(finish, 450);
		}
	};

	document.addEventListener("keydown", onKey);
	boot.addEventListener("click", finish);
	document.getElementById("boot-skip")?.addEventListener("click", finish);

	timer = window.setTimeout(step, 150);
}
