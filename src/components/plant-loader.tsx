"use client";

import { useEffect, useState } from 'react';

const tips = [
  "Did you know? Most houseplants prefer rainwater over tap water.",
  "Rotate your plants every week to ensure they get even sunlight.",
  "Yellow leaves can be a sign of overwatering.",
  "Dusting your plant's leaves helps them absorb more sunlight.",
  "Group plants together to create a more humid micro-environment.",
];

export function PlantLoader() {
  const [tip, setTip] = useState("");

  useEffect(() => {
    setTip(tips[Math.floor(Math.random() * tips.length)]);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <div className="w-24 h-24">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <style>{`
            .stem {
              stroke-dasharray: 100;
              stroke-dashoffset: 100;
              animation: draw 2s ease-in-out forwards;
            }
            .leaf {
              opacity: 0;
              animation: fade-in 1s ease-in forwards;
            }
            #leaf1 { animation-delay: 1s; }
            #leaf2 { animation-delay: 1.5s; }
            #leaf3 { animation-delay: 1.2s; }
            #leaf4 { animation-delay: 1.8s; }
            @keyframes draw {
              to { stroke-dashoffset: 0; }
            }
            @keyframes fade-in {
              to { opacity: 1; }
            }
          `}</style>
          <path className="stem" d="M 50 95 V 20" stroke="hsl(var(--foreground))" strokeWidth="3" fill="none" />
          <path id="leaf1" className="leaf" d="M 50 50 C 35 50 35 65 50 65" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <path id="leaf2" className="leaf" d="M 50 50 C 65 50 65 65 50 65" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <path id="leaf3" className="leaf" d="M 50 35 C 35 35 35 50 50 50" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
          <path id="leaf4" className="leaf" d="M 50 35 C 65 35 65 50 50 50" fill="hsl(var(--primary))" stroke="hsl(var(--foreground))" strokeWidth="1.5" />
        </svg>
      </div>
      <p className="text-muted-foreground font-body">{tip}</p>
    </div>
  );
}
