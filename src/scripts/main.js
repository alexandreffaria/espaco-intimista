/* Intimista — small, dependency-free behaviour.
   Every piece lives in its own file; this one just turns them on. */
import { stickHeader } from './header.js';
import { mountMenu } from './menu.js';
import { revealOnScroll } from './reveal.js';
import { mountWalkthrough } from './walkthrough.js';
import { mountDia } from './um-dia.js';

stickHeader();
mountMenu();
revealOnScroll();
mountWalkthrough();
mountDia();
