// Tek kayıt noktası: SmoothScroll / ScrollVideo / AutoTour buradan import eder,
// böylece ScrollTrigger asla iki kez register edilmez.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };
