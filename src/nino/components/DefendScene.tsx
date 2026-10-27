import React, { useEffect } from "react";
import Nino from "./Nino";
import type { Weapon } from "../utils/replies";

interface Props {
  weapon: Weapon;
  line: string;
  onDone: () => void;
}

/** Cena em que o Nino aparece do nada, armado de brinquedo, quando falam mal do criador. */
export default function DefendScene({ weapon, line, onDone }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 3800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  const bangs = weapon === "pistol" ? ["PÁ!", "PÁ!", "PÁ!"] : ["BONK!", "POW!"];

  return (
    <div className="defend" onClick={onDone} role="presentation">
      <div className="defend-nino">
        <span className="defend-poof" aria-hidden="true">
          💨
        </span>
        <div className="speech defend-speech">{line}</div>
        <Nino size={150} action="stomp" expression="angry" weapon={weapon} glow />
        {bangs.map((b, i) => (
          <span key={i} className={`defend-bang bang${i + 1} ${weapon}`} aria-hidden="true">
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}
