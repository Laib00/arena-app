import { useEffect, useRef, useState } from "react";
import "./MaskedHeading.css";

export default function MaskedHeading({
  text,
  src,
  mediaType = "image",
  poster,
  fillScale = 1,
  parallax = 0,
  reveal = "none",
  trigger = "view",
  className = "",
  as: Tag = "span",
}) {
  const rootRef = useRef(null);
  const [inView, setInView] = useState(trigger !== "view");
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    if (trigger !== "view" || !rootRef.current) return undefined;

    const node = rootRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [trigger]);

  useEffect(() => {
    if (!parallax || !rootRef.current) return undefined;

    let frame = 0;
    const update = () => {
      frame = 0;
      const node = rootRef.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      setParallaxY(((center - viewCenter) / window.innerHeight) * parallax);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [parallax]);

  const rootClass = [
    "masked-heading",
    mediaType === "video" ? "masked-heading--video" : "",
    reveal === "wipe" ? "masked-heading--wipe" : "",
    inView ? "is-in" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style = {
    "--masked-fill-scale": fillScale,
    "--masked-parallax-y": `${parallaxY}px`,
  };

  const textStyle =
    mediaType === "image"
      ? { backgroundImage: `url(${src})` }
      : undefined;

  return (
    <Tag ref={rootRef} className={rootClass} style={style}>
      {mediaType === "video" ? (
        <video
          className="masked-heading__media"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : null}
      <span className="masked-heading__text" style={textStyle} aria-label={text}>
        {text}
      </span>
    </Tag>
  );
}
