/* ============================================================
   Signal — intent-based mailto composer, plus the on-call
   pager easter egg (Datadog-style escalation toasts).
   ============================================================ */

const EMAIL = "mchalise@gmail.com";

const INTENTS: Record<string, { subject: string; body: string }> = {
	hiring: {
		subject: "[Hiring] Staff / principal engineering role — via the Chalise Ledger",
		body: "Hi Manish,\n\nI found you through mchalise.com.np and I'd like to talk about a staff/principal engineering role.\n\nCompany / team:\nRole:\n\nBest,",
	},
	founding: {
		subject: "[Building] Founding / consulting conversation — via the Chalise Ledger",
		body: "Hi Manish,\n\nI found you through mchalise.com.np and I'd like to discuss a founding-engineer or consulting engagement.\n\nWhat we're building:\nStage:\n\nBest,",
	},
	freelance: {
		subject: "[Freelance] Project inquiry — via the Chalise Ledger",
		body: "Hi Manish,\n\nI found you through mchalise.com.np and I have a project I'd like your help with.\n\nScope / timeline:\n\nBest,",
	},
};

export function initSignal(): void {
	const send = document.getElementById("signal-send");
	if (!send) return;

	send.addEventListener("click", () => {
		const selected = document.querySelector<HTMLInputElement>('input[name="intent"]:checked');
		const key = selected?.value ?? "hiring";
		const intent = INTENTS[key] ?? INTENTS.hiring;
		const href = `mailto:${EMAIL}?subject=${encodeURIComponent(intent.subject)}&body=${encodeURIComponent(intent.body)}`;
		window.location.href = href;
	});
}

/* ---------- Pager easter egg ---------- */

const ALERTS: Array<{ sev: string; title: string; body: string; dim: string }> = [
	{
		sev: "P1",
		title: "on-call escalation triggered",
		body: "Datadog alert → pager → engineer. I built this path at ZenLedger.",
		dim: "runbook: /oncall/triage · ack to dismiss",
	},
	{
		sev: "P2",
		title: "tax-season capacity alert",
		body: "Autoscaling group absorbed the cliff. Nothing to do here.",
		dim: "honeybadger: 0 new errors · cluster nominal",
	},
	{
		sev: "P3",
		title: "you found the pager",
		body: "Yes, the bell really pages someone. Twice, even.",
		dim: "tip: esc closes any dossier on this site",
	},
];

let alertIndex = 0;

export function initPager(): void {
	const btn = document.getElementById("pager");
	const region = document.getElementById("toast-region");
	if (!btn || !region) return;

	btn.addEventListener("click", () => {
		const alert = ALERTS[alertIndex % ALERTS.length];
		alertIndex++;

		btn.classList.remove("is-ringing");
		void btn.offsetWidth;
		btn.classList.add("is-ringing");

		// Keep the stack shallow.
		while (region.children.length >= 3) region.firstElementChild?.remove();

		const toast = document.createElement("div");
		toast.className = "toast";
		toast.innerHTML = "";

		const head = document.createElement("p");
		head.className = "toast-title";
		const sev = document.createElement("span");
		sev.textContent = `${alert.sev} · ${alert.title}`;
		const time = document.createElement("span");
		time.className = "toast-dim";
		time.textContent = "now";
		head.append(sev, time);

		const bodyEl = document.createElement("p");
		bodyEl.className = "toast-body";
		bodyEl.textContent = alert.body;

		const dim = document.createElement("p");
		dim.className = "toast-dim";
		dim.textContent = alert.dim;

		toast.append(head, bodyEl, dim);
		region.appendChild(toast);
		void toast.offsetWidth;
		toast.classList.add("is-in");

		window.setTimeout(() => {
			toast.classList.remove("is-in");
			window.setTimeout(() => toast.remove(), 500);
		}, 5200);
	});
}
