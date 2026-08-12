import React from "react";
import TrueFocus from "../../components/TrueFocus/TrueFocus";
import SpecularButton from "../../components/SpecularButton/SpecularButton";
import MagicRings from "../../components/MagicRings/MagicRings";

const HEADLINE = "Practice. Perform.";

export default function Hero() {
  return (
    <section className="lp-hero" id="top">
      <div className="lp-hero-bg" aria-hidden="true">
        <MagicRings
          color="#e48e59"
          colorTwo="#d98e61"
          ringCount={6}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.5}
          radiusStep={0.25}
          scaleRate={0.1}
          opacity={0.4}
          blur={0}
          noiseAmount={0.1}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={false}
          mouseInfluence={0.2}
          hoverScale={1.2}
          parallax={0.05}
          clickBurst={false}
        />
      </div>

      <div className="lp-wrap lp-hero-inner">
        <h1>
          <TrueFocus
            sentence={HEADLINE}
            manualMode={false}
            blurAmount={5}
            borderColor="#FD8841"
            glowColor="rgba(253, 136, 65, 0.55)"
            animationDuration={2}
            pauseBetweenAnimations={1}
          />
        </h1>

        <div className="lp-hero-bottom">
          <p className="lp-hero-tag">
            Knowledge gets you ready. Practice makes you dangerous.
          </p>

          <p className="lp-hero-sub">
            Build confidence through repeated practice with realistic people, situations,
            objections, and conversations you will face in the real world.
          </p>

          <div className="lp-hero-cta">
            <SpecularButton
              size="lg"
              radius={18}
              tint="#FD8841"
              tintOpacity={1}
              blur={0}
              textColor="#0a1628"
              lineColor="#ffffff"
              baseColor="#FD8841"
              intensity={1}
              shineSize={10}
              shineFade={40}
              thickness={1}
              speed={0.35}
              followMouse
              proximity={250}
              autoAnimate={false}
              onClick={() => {
                document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Enter The Arena
              <span className="lp-hero-cta-mark" aria-hidden="true" />
            </SpecularButton>
          </div>
        </div>
      </div>
    </section>
  );
}
