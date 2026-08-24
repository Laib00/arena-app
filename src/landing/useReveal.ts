import { useEffect, type CSSProperties, type RefObject } from "react";

/**
 * Reveals `.lp-reveal` elements. We used to rely on IntersectionObserver /
 * scroll geometry; Chrome + overflow on ancestors left every section at
 * opacity: 0. Reveal everything on mount so the landing never stays blank.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const revealAll = () => {
      root.querySelectorAll(".lp-reveal").forEach((el) => {
        el.classList.add("is-in");
      });
    };

    revealAll();
    // Fonts / layout can settle after first paint
    const raf = requestAnimationFrame(revealAll);
    const t = window.setTimeout(revealAll, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [rootRef]);
}

/** Staggers children of a revealed group so they cascade rather than pop. */
export function stagger(index: number, step = 90): CSSProperties {
  return { transitionDelay: `${index * step}ms` };
}
