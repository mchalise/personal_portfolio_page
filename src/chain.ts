/* ============================================================
   The Chain — block cards open a dossier drawer. Content is
   cloned from <template> nodes already in the HTML (SEO +
   no-JS friendly). Keyboard: Esc closes, Tab is trapped,
   prev/next walks the chain.
   ============================================================ */

interface Trigger {
	btn: HTMLButtonElement;
	templateId: string;
}

let triggers: Trigger[] = [];
let current = -1;
let lastFocus: HTMLElement | null = null;

let dossier: HTMLElement;
let body: HTMLElement;
let eyebrow: HTMLElement;
let pos: HTMLElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;
let closeBtn: HTMLButtonElement;

export function initChain(): void {
	dossier = document.getElementById("dossier")!;
	body = document.getElementById("dossier-body")!;
	eyebrow = document.getElementById("dossier-eyebrow")!;
	pos = document.getElementById("dossier-pos")!;
	prevBtn = document.getElementById("dossier-prev") as HTMLButtonElement;
	nextBtn = document.getElementById("dossier-next") as HTMLButtonElement;
	closeBtn = dossier.querySelector<HTMLButtonElement>(".dossier-close")!;

	triggers = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-dossier]")).map((btn) => ({
		btn,
		templateId: btn.dataset.dossier ?? "",
	}));

	triggers.forEach((t, i) => t.btn.addEventListener("click", () => open(i)));
	dossier.querySelectorAll("[data-dossier-close]").forEach((el) => el.addEventListener("click", close));
	prevBtn.addEventListener("click", () => open(current - 1));
	nextBtn.addEventListener("click", () => open(current + 1));
	document.addEventListener("keydown", onKeydown);
}

function open(index: number): void {
	if (index < 0 || index >= triggers.length) return;
	const { btn, templateId } = triggers[index];
	const tpl = document.getElementById(templateId);
	if (!(tpl instanceof HTMLTemplateElement)) return;

	const wasClosed = dossier.hasAttribute("hidden");
	body.replaceChildren(tpl.content.cloneNode(true));

	// Accessible name for the dialog comes from the injected heading.
	const h2 = body.querySelector("h2");
	if (h2) h2.id = "dossier-title";

	eyebrow.textContent = `block ${pad(index + 1)} / ${pad(triggers.length)} · dossier`;
	pos.textContent = `${index + 1} / ${triggers.length}`;
	prevBtn.disabled = index === 0;
	nextBtn.disabled = index === triggers.length - 1;
	body.scrollTop = 0;
	current = index;

	if (wasClosed) {
		lastFocus = (document.activeElement as HTMLElement | null) ?? btn;
		dossier.removeAttribute("hidden");
		// Force layout so the enter transition runs.
		void dossier.offsetWidth;
	}
	// Restart the redaction reveal for this dossier.
	dossier.classList.remove("is-open");
	void dossier.offsetWidth;
	dossier.classList.add("is-open");

	document.body.style.overflow = "hidden";
	closeBtn.focus({ preventScroll: true });
}

function close(): void {
	if (dossier.hasAttribute("hidden")) return;
	dossier.classList.remove("is-open");
	document.body.style.overflow = "";
	const settle = () => {
		if (!dossier.classList.contains("is-open")) dossier.setAttribute("hidden", "");
	};
	dossier.addEventListener("transitionend", settle, { once: true });
	window.setTimeout(settle, 600); // fallback if no transition fires
	lastFocus?.focus({ preventScroll: true });
	lastFocus = null;
	current = -1;
}

function onKeydown(e: KeyboardEvent): void {
	if (dossier.hasAttribute("hidden")) return;

	if (e.key === "Escape") {
		e.preventDefault();
		close();
		return;
	}
	if (e.key !== "Tab") return;

	// Trap focus inside the panel.
	const focusables = Array.from(
		dossier.querySelectorAll<HTMLElement>(
			'button:not(:disabled), a[href], input, [tabindex]:not([tabindex="-1"])',
		),
	).filter((el) => el.offsetParent !== null);
	if (focusables.length === 0) return;

	const first = focusables[0];
	const last = focusables[focusables.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}

function pad(n: number): string {
	return String(n).padStart(3, "0");
}
