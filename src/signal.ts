/* ============================================================
   Signal — intent-based mailto composer.
   ============================================================ */

const EMAIL = "mchalise@gmail.com";

const INTENTS: Record<string, { subject: string; body: string }> = {
	hiring: {
		subject: "[Hiring] Staff / principal engineering role — via the career island",
		body: "Hi Manish,\n\nI explored your island (mchalise.com.np) and I'd like to talk about a staff/principal engineering role.\n\nCompany / team:\nRole:\n\nBest,",
	},
	founding: {
		subject: "[Building] Founding / consulting conversation — via the career island",
		body: "Hi Manish,\n\nI explored your island (mchalise.com.np) and I'd like to discuss a founding-engineer or consulting engagement.\n\nWhat we're building:\nStage:\n\nBest,",
	},
	freelance: {
		subject: "[Freelance] Project inquiry — via the career island",
		body: "Hi Manish,\n\nI explored your island (mchalise.com.np) and I have a project I'd like your help with.\n\nScope / timeline:\n\nBest,",
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
