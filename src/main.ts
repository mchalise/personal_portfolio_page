import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/sections.css";
import "./styles/dossier.css";

import { initBoot } from "./boot";
import { initCanvas } from "./canvas";
import { initChain } from "./chain";
import { initCounters, initReveal } from "./sections";
import { initMotionToggle } from "./motion";
import { initPager, initSignal } from "./signal";

initBoot();
initCanvas();
initChain();
initReveal();
initCounters();
initSignal();
initPager();
initMotionToggle();

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
