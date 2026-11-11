import { useEffect, useState } from "react";

// =============================================================================
// MAPA DE PRÉ-VISUALIZAÇÃO (apenas visual, não faz parte do controle)
//
// Mostra um carrinho num mapa e desenha o caminho por onde ele "andou".
// É uma simulação: não recebe nada do carrinho de verdade, só anda na tela
// enquanto uma direção está pressionada.
// =============================================================================

type Direcao = "cima" | "baixo" | "esquerda" | "direita";

type Posicao = { x: number; y: number };
type Carro = { x: number; y: number; angulo: number; rastro: Posicao[] };

const CARRO_INICIAL: Carro = { x: 50, y: 50, angulo: 0, rastro: [] };
const PASSO = 2.1; // quanto o carro anda a cada atualização (% do mapa)

// Para onde o ícone do carro aponta em cada direção (graus)
const ANGULOS: Record<Direcao, number> = { cima: 0, direita: 90, baixo: 180, esquerda: -90 };

// Mantém o valor dentro de um intervalo (para o carro não sair do mapa)
const limitar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor));

// Calcula a nova posição do carro e acrescenta o ponto ao rastro
function andar(carro: Carro, direcao: Direcao): Carro {
  const dx = direcao === "esquerda" ? -PASSO : direcao === "direita" ? PASSO : 0;
  const dy = direcao === "cima" ? -PASSO : direcao === "baixo" ? PASSO : 0;
  const x = limitar(carro.x + dx, 9, 91);
  const y = limitar(carro.y + dy, 11, 89);
  const moveu = x !== carro.x || y !== carro.y;
  const rastro = moveu ? [...carro.rastro.slice(-119), { x, y }] : carro.rastro;
  return { x, y, angulo: ANGULOS[direcao], rastro };
}

// Desenho do carrinho visto de cima
const CarroIcone = () => (
  <svg aria-hidden="true" viewBox="0 0 40 40" className="h-9 w-9 drop-shadow-[0_3px_4px_rgba(36,56,80,0.4)]">
    <g fill="#2a3440">
      <rect x="3" y="4.4" width="6.2" height="9" rx="2.4" />
      <rect x="30.8" y="4.4" width="6.2" height="9" rx="2.4" />
      <rect x="3" y="26.6" width="6.2" height="9" rx="2.4" />
      <rect x="30.8" y="26.6" width="6.2" height="9" rx="2.4" />
    </g>
    <rect x="6.8" y="6.4" width="26.4" height="27.2" rx="9" fill="#eef4f9" stroke="#aebfce" strokeWidth="1.6" />
    <path d="M12.2 15.6 12.8 10.9A4 4 0 0 1 16.2 8h7.6a4 4 0 0 1 3.4 2.9l.7 4.7" fill="#354b63" stroke="#27394d" strokeWidth="1" strokeLinejoin="round" />
    <rect x="12.9" y="16.4" width="14.2" height="9.6" rx="4" fill="#5c84ad" stroke="#4a6f96" strokeWidth="1" />
    <circle cx="10.8" cy="9.4" r="1.7" fill="#ffd76a" />
    <circle cx="29.2" cy="9.4" r="1.7" fill="#ffd76a" />
    <g fill="#e0524f">
      <rect x="11.6" y="30.4" width="4" height="2.2" rx="1.1" />
      <rect x="24.4" y="30.4" width="4" height="2.2" rx="1.1" />
    </g>
  </svg>
);

// Ícone do botão de reiniciar
const ReiniciarIcone = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
    <path
      d="M4 4v6h6M20 20v-6h-6M20 10a8.2 8.2 0 0 0-14.4-2.1M4 14a8.2 8.2 0 0 0 14.4 2.1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

// "direcao" = direção pressionada agora (null = parado)
export default function Mapa({ direcao }: { direcao: Direcao | null }) {
  const [carro, setCarro] = useState<Carro>(CARRO_INICIAL);

  // Enquanto houver uma direção pressionada, anda um passo a cada 160 ms
  useEffect(() => {
    if (!direcao) return;
    const timer = setInterval(() => setCarro((c) => andar(c, direcao)), 160);
    return () => clearInterval(timer);
  }, [direcao]);

  // Rastro no formato aceito pelo <polyline> do SVG
  const pontos = carro.rastro.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="preview-wrap">
      <div className="vehicle-preview" role="img" aria-label="Visão estilo GPS do carrinho com o caminho percorrido">
        <span className="preview-compass" aria-hidden="true">N</span>

        <div className="preview-world">
          <div className="preview-grid" aria-hidden="true" />
          <svg className="preview-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {pontos && (
              <>
                <polyline className="preview-route-casing" points={pontos} />
                <polyline className="preview-route-line" points={pontos} />
                <polyline className="preview-route-dash" points={pontos} />
              </>
            )}
          </svg>
          <div
            className="preview-car"
            style={{ left: `${carro.x}%`, top: `${carro.y}%`, transform: `translate(-50%, -50%) rotate(${carro.angulo}deg)` }}
          >
            <CarroIcone />
          </div>
        </div>

        <button type="button" className="preview-reset" onClick={() => setCarro(CARRO_INICIAL)} aria-label="Reiniciar posição">
          <ReiniciarIcone />
        </button>
      </div>
      <p className="preview-caption">Pré-visualização</p>
    </div>
  );
}
