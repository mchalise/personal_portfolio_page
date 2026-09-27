/* ============================================================
   Status line + toasts — the island's ambient announcer.
   #stage-status is a polite live region (acrokat parity);
   toasts are used by the bell easter egg.
   ============================================================ */

export function showStatus(text: string): void {
	const el = document.getElementById("stage-status");
	if (!el) return;
	// Mutate even when identical so polite live regions re-announce.
	el.textContent = "";
	el.textContent = text;
}

export function toast(sev: string, title: string, body: string, dim: string): void {
	const region = document.getElementById("toast-region");
	if (!region) return;

	while (region.children.length >= 3) region.firstElementChild?.remove();

	const el = document.createElement("div");
	el.className = "toast";

	const head = document.createElement("p");
	head.className = "toast-title";
	const sevEl = document.createElement("span");
	sevEl.textContent = `${sev} · ${title}`;
	const timeEl = document.createElement("span");
	timeEl.className = "toast-dim";
	timeEl.textContent = "now";
	head.append(sevEl, timeEl);

	const bodyEl = document.createElement("p");
	bodyEl.className = "toast-body";
	bodyEl.textContent = body;

	const dimEl = document.createElement("p");
	dimEl.className = "toast-dim";
	dimEl.textContent = dim;

	el.append(head, bodyEl, dimEl);
	region.appendChild(el);
	void el.offsetWidth;
	el.classList.add("is-in");

	window.setTimeout(() => {
		el.classList.remove("is-in");
		window.setTimeout(() => el.remove(), 500);
	}, 5200);
}
