import { useEffect, type CSSProperties, type RefObject } from "react";

/**
 * Fades sections in as they scroll into view. Elements opt in with the
 * `lp-reveal` class; anything already on screen at mount is revealed
 * immediately so the top of the page never flashes empty.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll(".lp-reveal");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/** Staggers children of a revealed group so they cascade rather than pop. */
export function stagger(index: number, step = 90): CSSProperties {
  return { transitionDelay: `${index * step}ms` };
}
