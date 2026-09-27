/* ============================================================
   Dossier drawer — career-stop detail panel. Content is cloned
   from <template> nodes in the HTML (SEO + no-JS friendly).
   The 3D island opens it via the "island:open-dossier" event;
   the overlay buttons open it through the island (camera flies).
   Keyboard: Esc closes, focus is trapped, prev/next walks stops.
   ============================================================ */

const REGISTRY = [
	{ id: "eb-pearls", templateId: "dossier-eb-pearls", label: "EB Pearls" },
	{ id: "fgd", templateId: "dossier-fgd", label: "First Global Data" },
	{ id: "eepos", templateId: "dossier-eepos", label: "Eepos IT / InvestReady" },
	{ id: "whitehat", templateId: "dossier-whitehat", label: "WhiteHat Engineering" },
	{ id: "zenledger", templateId: "dossier-zenledger", label: "ZenLedger" },
	{ id: "bats", templateId: "dossier-bats", label: "ZenLedger / BATS federal" },
] as const;

let current = -1;
let lastFocus: HTMLElement | null = null;

let dossier: HTMLElement;
let body: HTMLElement;
let eyebrow: HTMLElement;
let pos: HTMLElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;
let closeBtn: HTMLButtonElement;

export function initDossier(): void {
	dossier = document.getElementById("dossier")!;
	body = document.getElementById("dossier-body")!;
	eyebrow = document.getElementById("dossier-eyebrow")!;
	pos = document.getElementById("dossier-pos")!;
	prevBtn = document.getElementById("dossier-prev") as HTMLButtonElement;
	nextBtn = document.getElementById("dossier-next") as HTMLButtonElement;
	closeBtn = dossier.querySelector<HTMLButtonElement>(".dossier-close")!;

	dossier.querySelectorAll("[data-dossier-close]").forEach((el) => el.addEventListener("click", close));
	prevBtn.addEventListener("click", () => openByIndex(current - 1));
	nextBtn.addEventListener("click", () => openByIndex(current + 1));
	document.addEventListener("keydown", onKeydown);
	document.addEventListener("island:open-dossier", (e) => {
		const id = (e as CustomEvent<string>).detail;
		const index = REGISTRY.findIndex((r) => r.id === id);
		if (index >= 0) openByIndex(index);
	});
}

function openByIndex(index: number): void {
	if (index < 0 || index >= REGISTRY.length) return;
	const entry = REGISTRY[index];
	const tpl = document.getElementById(entry.templateId);
	if (!(tpl instanceof HTMLTemplateElement)) return;

	const wasClosed = dossier.hasAttribute("hidden");
	body.replaceChildren(tpl.content.cloneNode(true));

	// Accessible name for the dialog comes from the injected heading.
	const h2 = body.querySelector("h2");
	if (h2) h2.id = "dossier-title";

	eyebrow.textContent = `${entry.label.toLowerCase()} · dossier`;
	pos.textContent = `${index + 1} / ${REGISTRY.length}`;
	prevBtn.disabled = index === 0;
	nextBtn.disabled = index === REGISTRY.length - 1;
	body.scrollTop = 0;
	current = index;

	if (wasClosed) {
		lastFocus = (document.activeElement as HTMLElement | null) ?? closeBtn;
		dossier.removeAttribute("hidden");
		void dossier.offsetWidth;
	}
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
	window.setTimeout(settle, 600);
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
