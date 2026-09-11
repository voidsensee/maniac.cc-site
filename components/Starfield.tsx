"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  pz: number;
};

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const stars: Star[] = [];
    const count = 400;

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width - width / 2,
        y: Math.random() * height - height / 2,
        z: Math.random() * width,
        pz: 0,
      });
      stars[i].pz = stars[i].z;
    }

    let raf = 0;
    const cx = width / 2;
    const cy = height / 2;

    function tick() {
      ctx!.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx!.fillRect(0, 0, width, height);

      for (const s of stars) {
        s.z -= 4;
        if (s.z < 1) {
          s.x = Math.random() * width - width / 2;
          s.y = Math.random() * height - height / 2;
          s.z = width;
          s.pz = s.z;
        }
        const sx = (s.x / s.z) * width + cx;
        const sy = (s.y / s.z) * height + cy;
        const px = (s.x / s.pz) * width + cx;
        const py = (s.y / s.pz) * height + cy;
        s.pz = s.z;

        const size = Math.max(0.4, (1 - s.z / width) * 2);
        const alpha = Math.min(1, (1 - s.z / width) * 1.4);

        ctx!.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.lineWidth = size;
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(sx, sy);
        ctx!.stroke();
      }

      raf = requestAnimationFrame(tick);
    }

    tick();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
      aria-hidden="true"
    />
  );
}
