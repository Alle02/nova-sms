import { useEffect, useRef } from 'react';
import { fitCanvas } from './components';
import type { ActivityDay } from './api';

const cssVar = (n: string) =>
  getComputedStyle(document.body).getPropertyValue(n).trim() || '#e9e2d4';

export function Donut({ values }: { values: [number, number, number, number] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = fitCanvas(c, 150, 150);
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let a = -Math.PI / 2;
    const cols = ['#38bdf8', '#ff5b8d', '#f5c518', '#1e6ff5'];
    x.clearRect(0, 0, 150, 150);
    values.forEach((n, i) => {
      const s = (n / total) * Math.PI * 2;
      x.beginPath(); x.moveTo(75, 75); x.arc(75, 75, 68, a, a + s);
      x.fillStyle = cols[i]; x.fill(); a += s;
    });
    x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(75, 75, 38, 0, 7); x.fill();
    x.globalCompositeOperation = 'source-over';
  });
  return <canvas ref={ref} id="donut" width={150} height={150} />;
}

export function Funnel({ values }: { values: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = fitCanvas(c, 300, 170);
    x.clearRect(0, 0, 300, 170);
    const M = Math.max(...values, 1);
    const cols = ['#1e6ff5', '#38bdf8', '#ff5b8d', '#f5c518'];
    values.forEach((v, i) => {
      const hh = (v / M) * 130;
      x.fillStyle = cols[i % 4];
      x.beginPath();
      (x as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect(14 + i * 68, 155 - hh, 44, hh, 8);
      x.fill();
    });
  });
  return <canvas ref={ref} id="bar" width={300} height={170} />;
}

export function Volume({ data, id }: { data: ActivityDay[]; id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !data.length) return;
    const W = 520, H = 180;
    const x = fitCanvas(c, W, H);
    x.clearRect(0, 0, W, H);
    const M = Math.max(...data.map(v => v.outbound), 1);
    const n = data.length, gap = 10;
    const bw = (W - 20 - (n - 1) * gap) / n;
    const dark = document.body.classList.contains('dark');
    x.font = '10px sans-serif'; x.textAlign = 'center';
    data.forEach((v, i) => {
      const bx = 10 + i * (bw + gap);
      const bh = Math.max(3, (v.outbound / M) * 120), by = 150 - bh;
      const g = x.createLinearGradient(0, by, 0, 150);
      g.addColorStop(0, '#1e6ff5'); g.addColorStop(1, '#5aa5ff');
      x.fillStyle = g;
      x.beginPath();
      (x as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect(bx, by, bw, bh, [6, 6, 0, 0]);
      x.fill();
      if (v.outbound) {
        x.fillStyle = dark ? '#f2edff' : '#191423';
        x.fillText(String(v.outbound), bx + bw / 2, by - 5);
      }
      x.fillStyle = cssVar('--mut') || '#7a7387';
      x.fillText(v.day, bx + bw / 2, 166);
      if (v.delivered) {
        const dy = 150 - Math.max(2, (v.delivered / M) * 120);
        x.fillStyle = '#38bdf8';
        x.beginPath(); x.arc(bx + bw / 2, dy, 3.5, 0, 7); x.fill();
      }
    });
  }, [data]);
  return <canvas ref={ref} id={id} width={520} height={180} />;
}
