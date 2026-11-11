import { useEffect, useState } from "react";
import Mapa from "./Mapa"; // painel visual com o carrinho (não faz parte do controle)

// =============================================================================
// CONTROLE REMOTO DO CARRINHO (ESP32)
//
// A ideia do programa em 3 passos:
//   1. O usuário aperta botões da tela ou setas do teclado  -> lista "apertadas"
//   2. A lista vira o estado das 4 rodas (ligada = 1, desligada = 0)
//   3. As rodas são enviadas ao carrinho em JSON por WebSocket, ex.:
//        {"fd":1,"td":0,"fe":1,"te":0}
//      (f = frente, t = trás, d = direita, e = esquerda)
//
// A velocidade não é controlada aqui: quem define é o código do carrinho.
// =============================================================================

type Direcao = "cima" | "baixo" | "esquerda" | "direita";

const PORTA = 81; // porta do servidor WebSocket no carrinho

// Cada seta do teclado corresponde a uma direção
const TECLAS: Record<string, Direcao> = {
  ArrowUp: "cima",
  ArrowDown: "baixo",
  ArrowLeft: "esquerda",
  ArrowRight: "direita",
};

// Botões da tela: direção, texto, rotação do ícone (graus) e posição na grade (CSS)
const BOTOES: { direcao: Direcao; texto: string; graus: number; posicao: string }[] = [
  { direcao: "cima", texto: "Acelerar", graus: 0, posicao: "control-forward" },
  { direcao: "esquerda", texto: "Esquerda", graus: -90, posicao: "control-left" },
  { direcao: "direita", texto: "Direita", graus: 90, posicao: "control-right" },
  { direcao: "baixo", texto: "Ré", graus: 180, posicao: "control-reverse" },
];

// Transforma as direções apertadas no estado das 4 rodas.
//   cima = as duas rodas da frente | baixo = as duas de trás
//   esquerda = só a roda direita da frente (o carro gira para a esquerda)
//   direita  = só a roda esquerda da frente (o carro gira para a direita)
// Direções opostas (cima + baixo, esquerda + direita) se cancelam.
function calcularRodas(apertadas: Direcao[]) {
  const tem = (d: Direcao) => apertadas.includes(d);
  const cima = tem("cima") && !tem("baixo");
  const baixo = tem("baixo") && !tem("cima");
  const esquerda = tem("esquerda") && !tem("direita");
  const direita = tem("direita") && !tem("esquerda");

  return {
    fd: Number((cima && !direita) || (esquerda && !baixo)),
    td: Number(baixo && !direita),
    fe: Number((cima && !esquerda) || (direita && !baixo)),
    te: Number(baixo && !esquerda),
  };
}

// Bolinha do painel "Rodas": azul = ligada, cinza = desligada
const Bolinha = ({ ligada }: { ligada: number }) => (
  <span
    className={`mx-auto h-3 w-3 rounded-full ${ligada ? "bg-[#6f8fb5] shadow-[0_0_0_3px_rgba(111,143,181,0.18)]" : "bg-slate-200"}`}
  />
);

export default function App() {
  const [apertadas, setApertadas] = useState<Direcao[]>([]); // botões/setas pressionados agora
  const [endereco, setEndereco] = useState(""); // IP digitado pelo usuário
  const [conexao, setConexao] = useState<WebSocket | null>(null); // null = desconectado

  const rodas = calcularRodas(apertadas);
  const mensagem = JSON.stringify(rodas); // é isto que o carrinho recebe
  const conectado = conexao !== null;
  const parado = apertadas.length === 0;

  const apertar = (d: Direcao) => setApertadas((lista) => (lista.includes(d) ? lista : [...lista, d]));
  const soltar = (d: Direcao) => setApertadas((lista) => lista.filter((x) => x !== d));

  // ---- CONEXÃO COM O CARRINHO ----------------------------------------------
  // O navegador abre o WebSocket (ws://IP:81). Quando o carrinho aceita
  // ("onopen"), guardamos a conexão; se cair ("onclose"), voltamos a null.
  const conectar = () => {
    const ws = new WebSocket(`ws://${endereco.trim()}:${PORTA}`);
    ws.onopen = () => setConexao(ws);
    ws.onclose = () => setConexao(null);
  };

  // Manda tudo desligado (o carrinho para) e fecha a conexão
  const desconectar = () => {
    conexao?.send(JSON.stringify(calcularRodas([])));
    conexao?.close();
  };

  // ---- ENVIO DOS COMANDOS --------------------------------------------------
  // Envia assim que o estado muda e repete a cada 100 ms, igual ao controle
  // físico, para o carrinho nunca ficar com um comando velho.
  useEffect(() => {
    if (!conexao) return;
    const enviar = () => conexao.send(mensagem);
    enviar();
    const timer = setInterval(enviar, 100);
    return () => clearInterval(timer);
  }, [conexao, mensagem]);

  // ---- TECLADO -------------------------------------------------------------
  // Setas apertam/soltam direções (várias ao mesmo tempo = combinação).
  // Se a janela perder o foco, solta tudo por segurança.
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => {
      const direcao = TECLAS[e.key];
      if (!direcao || (e.target as HTMLElement).tagName === "INPUT") return; // ignora ao digitar o IP
      e.preventDefault();
      apertar(direcao);
    };
    const aoSoltar = (e: KeyboardEvent) => TECLAS[e.key] && soltar(TECLAS[e.key]);
    const aoPerderFoco = () => setApertadas([]);

    window.addEventListener("keydown", aoApertar);
    window.addEventListener("keyup", aoSoltar);
    window.addEventListener("blur", aoPerderFoco);
    return () => {
      window.removeEventListener("keydown", aoApertar);
      window.removeEventListener("keyup", aoSoltar);
      window.removeEventListener("blur", aoPerderFoco);
    };
  }, []);

  // ---- TELA ----------------------------------------------------------------
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />

      <section className="remote-shell relative w-full max-w-[590px]">
        {/* Título + status da conexão + campo de IP */}
        <header className="mb-7 flex items-start justify-between gap-5 sm:mb-8">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Carrinho ESP32</p>
            <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px]">
              Controle do carrinho
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Mantenha pressionado para mover</p>
          </div>

          <div className="connection-panel mt-1">
            <div className={`connection-pill ${conectado ? "" : "is-offline"}`} role="status">
              <span className="connection-dot" />
              {conectado ? "Conectado" : "Desconectado"}
            </div>
            <form
              className="connection-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (conectado) desconectar();
                else conectar();
              }}
            >
              <input
                className="address-input"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="172.20.10.6"
                aria-label="Endereço IP do carrinho"
                spellCheck={false}
              />
              <button type="submit" className="connect-button" disabled={!conectado && !endereco.trim()}>
                {conectado ? "Desconectar" : "Conectar"}
              </button>
            </form>
          </div>
        </header>

        {/* Mapa simulado: anda na direção da última seta/botão pressionado */}
        <Mapa direcao={apertadas[apertadas.length - 1] ?? null} />

        {/* Estado atual + rodas (mostra exatamente o que é enviado ao carrinho) */}
        <div className="status-panel" aria-live="polite">
          <div>
            <p className="status-label">Estado atual</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className={`state-marker ${parado ? "" : "moving"}`} />
              <p className="text-lg font-medium tracking-[-0.02em] text-slate-800">
                {parado ? "Parado" : "Em movimento"}
              </p>
            </div>
          </div>
          <div className="h-11 w-px bg-slate-200/80" />
          <div className="text-right">
            <p className="status-label">Rodas</p>
            <div className="mt-1.5 grid grid-cols-[auto_auto_auto] items-center justify-end gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span />
              <span>Esq</span>
              <span>Dir</span>
              <span className="text-right">Frente</span>
              <Bolinha ligada={rodas.fe} />
              <Bolinha ligada={rodas.fd} />
              <span className="text-right">Trás</span>
              <Bolinha ligada={rodas.te} />
              <Bolinha ligada={rodas.td} />
            </div>
          </div>
        </div>

        {/* Botões: apertar = liga a direção, soltar = desliga */}
        <div className="controls-grid mt-7 sm:mt-8">
          {BOTOES.map((b) => (
            <button
              key={b.direcao}
              type="button"
              className={`drive-button ${apertadas.includes(b.direcao) ? "is-active" : ""} ${b.posicao}`}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId); // garante receber o "soltar"
                apertar(b.direcao);
              }}
              onPointerUp={() => soltar(b.direcao)}
              onPointerCancel={() => soltar(b.direcao)}
            >
              <span className="button-icon">
                <svg viewBox="0 0 24 24" className="h-6 w-6" style={{ transform: `rotate(${b.graus}deg)` }}>
                  <path
                    d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </span>
              <span>{b.texto}</span>
            </button>
          ))}

          <button type="button" className="stop-button" onClick={() => setApertadas([])}>
            <span className="stop-symbol">
              <span />
            </span>
            <span>PARAR</span>
          </button>
        </div>

        <footer className="mt-7 border-t border-slate-100 pt-5 text-center text-xs text-slate-400">
          Também funciona com as setas do teclado
        </footer>
      </section>
    </main>
  );
}
