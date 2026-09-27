/* ============================================================
   Entry — boot the island.
   ============================================================ */
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/island.css";
import "./styles/dossier.css";

import { initBoot } from "./boot";
import { initIsland } from "./island";
import { initDossier } from "./dossier";
import { initCounters, initReveal } from "./sections";
import { initSignal } from "./signal";
import { initMotionToggle } from "./motion";

initBoot();
initIsland();
initDossier();
initReveal();
initCounters();
initSignal();
initMotionToggle();

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());
