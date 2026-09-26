/* ============================================================
   Section behaviors — IntersectionObserver reveals and the
   Verified stat-wall count-ups. Static HTML already holds the
   final values, so no-JS and reduced-motion both stay correct.
   ============================================================ */
import { motionAllowed } from "./motion";

export function initReveal(): void {
	const els = document.querySelectorAll("[data-reveal]");
	if (!("IntersectionObserver" in window)) {
		els.forEach((el) => el.classList.add("is-in"));
		return;
	}
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-in");
					io.unobserve(entry.target);
				}
			}
		},
		{ rootMargin: "0px 0px -6% 0px", threshold: 0.12 },
	);
	els.forEach((el) => io.observe(el));
}

export function initCounters(): void {
	const nums = document.querySelectorAll<HTMLElement>(".stat-num[data-count]");
	if (nums.length === 0) return;

	const animate = (el: HTMLElement) => {
		const target = Number(el.dataset.count);
		if (Number.isNaN(target)) return;
		const prefix = el.dataset.prefix ?? "";
		const suffix = el.dataset.suffix ?? "";

		if (!motionAllowed()) {
			el.textContent = `${prefix}${target}${suffix}`;
			return;
		}

		const dur = 1500;
		const start = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - start) / dur);
			const eased = 1 - Math.pow(1 - p, 3);
			el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
			if (p < 1) requestAnimationFrame(step);
		};
		el.textContent = `${prefix}0${suffix}`;
		requestAnimationFrame(step);
	};

	if (!("IntersectionObserver" in window)) return;
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					animate(entry.target as HTMLElement);
					io.unobserve(entry.target);
				}
			}
		},
		{ threshold: 0.4 },
	);
	nums.forEach((el) => io.observe(el));
}
