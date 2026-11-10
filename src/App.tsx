import { useEffect, useRef, useState } from "react";

type Control = "forward" | "reverse" | "left" | "right" | null;

const WS_PORT = 81;

// fd/td = frente/trás direita, fe/te = frente/trás esquerda (1 = ligado)
const CONTROL_TO_WHEELS: Record<Exclude<Control, null> | "stop", { fd: number; td: number; fe: number; te: number }> = {
  forward: { fd: 1, td: 0, fe: 1, te: 0 },
  reverse: { fd: 0, td: 1, fe: 0, te: 1 },
  left: { fd: 1, td: 0, fe: 0, te: 0 },
  right: { fd: 0, td: 0, fe: 1, te: 0 },
  stop: { fd: 0, td: 0, fe: 0, te: 0 },
};

type TrailPoint = { x: number; y: number };
type CarState = { x: number; y: number; heading: number; trail: TrailPoint[] };

const INITIAL_CAR: CarState = { x: 50, y: 50, heading: 0, trail: [] };

const TRAIL_STEP = 2.1;
const HEADINGS: Record<Exclude<Control, null>, number> = {
  forward: 0,
  right: 90,
  reverse: 180,
  left: -90,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function moveCar(prev: CarState, control: Exclude<Control, null>): CarState {
  const dx = control === "left" ? -TRAIL_STEP : control === "right" ? TRAIL_STEP : 0;
  const dy = control === "forward" ? -TRAIL_STEP : control === "reverse" ? TRAIL_STEP : 0;
  const x = clamp(prev.x + dx, 9, 91);
  const y = clamp(prev.y + dy, 11, 89);
  const moved = x !== prev.x || y !== prev.y;
  const trail = moved ? [...prev.trail.slice(-119), { x, y }] : prev.trail;
  return { x, y, heading: HEADINGS[control], trail };
}

const ArrowIcon = ({ direction }: { direction: "up" | "down" | "left" | "right" }) => {
  const rotation = {
    up: "rotate(0 12 12)",
    right: "rotate(90 12 12)",
    down: "rotate(180 12 12)",
    left: "rotate(-90 12 12)",
  }[direction];

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <g transform={rotation}>
        <path
          d="M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
};

const CarIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
    <path
      d="M5 16.5v1.25M19 16.5v1.25M4 13l1.3-4.15A2 2 0 0 1 7.2 7.5h9.6a2 2 0 0 1 1.9 1.35L20 13m-16 0h16a1 1 0 0 1 1 1v2.5H3V14a1 1 0 0 1 1-1Zm3 1.75h.01m9.98 0H17"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

type DriveButtonProps = {
  control: Exclude<Control, null>;
  direction: "up" | "down" | "left" | "right";
  label: string;
  active: boolean;
  className?: string;
  onStart: (control: Exclude<Control, null>) => void;
  onEnd: () => void;
};

function DriveButton({
  control,
  direction,
  label,
  active,
  className = "",
  onStart,
  onEnd,
}: DriveButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`drive-button ${active ? "is-active" : ""} ${className}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onStart(control);
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
      onKeyDown={(event) => {
        if (!event.repeat && (event.key === " " || event.key === "Enter")) onStart(control);
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") onEnd();
      }}
    >
      <span className="button-icon">
        <ArrowIcon direction={direction} />
      </span>
      <span>{label}</span>
    </button>
  );
}

const CarTopIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 40 40" className="h-9 w-9 drop-shadow-[0_3px_4px_rgba(36,56,80,0.4)]">
    <g fill="#2a3440">
      <rect x="3" y="4.4" width="6.2" height="9" rx="2.4" />
      <rect x="30.8" y="4.4" width="6.2" height="9" rx="2.4" />
      <rect x="3" y="26.6" width="6.2" height="9" rx="2.4" />
      <rect x="30.8" y="26.6" width="6.2" height="9" rx="2.4" />
    </g>
    <g fill="none" stroke="#aebfce" strokeWidth="1.6">
      <rect x="6.8" y="6.4" width="26.4" height="27.2" rx="9" fill="#eef4f9" />
    </g>
    <path d="M12.2 15.6 12.8 10.9A4 4 0 0 1 16.2 8h7.6a4 4 0 0 1 3.4 2.9l.7 4.7" fill="#354b63" stroke="#27394d" strokeWidth="1" strokeLinejoin="round" />
    <rect x="12.9" y="16.4" width="14.2" height="9.6" rx="4" fill="#5c84ad" stroke="#4a6f96" strokeWidth="1" />
    <g>
      <circle cx="10.8" cy="9.4" r="1.7" fill="#ffd76a" />
      <circle cx="29.2" cy="9.4" r="1.7" fill="#ffd76a" />
    </g>
    <g fill="#e0524f">
      <rect x="11.6" y="30.4" width="4" height="2.2" rx="1.1" />
      <rect x="24.4" y="30.4" width="4" height="2.2" rx="1.1" />
    </g>
  </svg>
);

const ResetIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5">
    <path
      d="M4 4v6h6M20 20v-6h-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
    <path
      d="M20 10a8.2 8.2 0 0 0-14.4-2.1M4 14a8.2 8.2 0 0 0 14.4 2.1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

export default function App() {
  const [activeControl, setActiveControl] = useState<Control>(null);
  const [speed, setSpeed] = useState(0);
  const [car, setCar] = useState<CarState>(INITIAL_CAR);
  const [address, setAddress] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const buildWsUrl = (input: string) => {
    let url = input.trim().replace(/^(https?|wss?):\/\//i, "").replace(/\/+$/, "");
    if (!/:\d+$/.test(url)) url = `${url}:${WS_PORT}`;
    return `ws://${url}/`;
  };

  // Acessando por túnel (https), o carrinho é alcançado via proxy do servidor em /car
  const viaTunnel = window.location.protocol === "https:";

  const connect = () => {
    if ((!viaTunnel && !address.trim()) || connecting) return;
    setConnecting(true);
    let socket: WebSocket;
    try {
      socket = new WebSocket(viaTunnel ? `wss://${window.location.host}/car` : buildWsUrl(address));
    } catch {
      setConnecting(false);
      return;
    }
    wsRef.current = socket;
    socket.onopen = () => {
      setConnecting(false);
      setConnected(true);
    };
    socket.onclose = () => {
      if (wsRef.current === socket) wsRef.current = null;
      setConnecting(false);
      setConnected(false);
    };
    socket.onerror = () => socket.close();
  };

  const disconnect = () => {
    const socket = wsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(CONTROL_TO_WHEELS.stop));
    socket?.close();
    wsRef.current = null;
    setConnected(false);
  };

  useEffect(() => {
    const socket = wsRef.current;
    if (!connected || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(CONTROL_TO_WHEELS[activeControl ?? "stop"]));
  }, [activeControl, connected]);

  useEffect(() => () => wsRef.current?.close(), []);

  useEffect(() => {
    if (!activeControl) return;

    if (activeControl === "forward" || activeControl === "reverse") {
      setSpeed(18);
    } else {
      setSpeed(24);
    }

    const timer = window.setInterval(() => {
      if (activeControl === "forward" || activeControl === "reverse") {
        setSpeed((value) => Math.min(value + 4, 100));
      }
      setCar((prev) => moveCar(prev, activeControl));
    }, 160);

    return () => window.clearInterval(timer);
  }, [activeControl]);

  const stop = () => {
    setActiveControl(null);
    setSpeed(0);
  };

  const resetCar = () => setCar(INITIAL_CAR);

  const routePoints = car.trail.map((point) => `${point.x},${point.y}`).join(" ");

  const stateLabel = ({
    forward: "Forward",
    reverse: "Reverse",
    left: "Turning Left",
    right: "Turning Right",
  } as Record<string, string>)[activeControl ?? ""] ?? "Stopped";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />

      <section className="remote-shell relative w-full max-w-[590px]" aria-labelledby="remote-title">
        <header className="mb-7 flex items-start justify-between gap-5 sm:mb-8">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <CarIcon />
              </span>
              ESP32 Drive
            </div>
            <h1 id="remote-title" className="text-[28px] font-semibold tracking-[-0.035em] text-slate-900 sm:text-[32px]">
              Vehicle control
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">Press and hold to move</p>
          </div>

          <div className="connection-panel mt-1">
            <div
              className={`connection-pill ${connected ? "" : "is-offline"}`}
              role="status"
              aria-label={connected ? "Vehicle connected" : "Vehicle not connected"}
            >
              <span className="connection-dot" />
              {connected ? "Connected" : connecting ? "Connecting…" : "Offline"}
            </div>
            <form
              className="connection-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (connected) disconnect();
                else connect();
              }}
            >
              <input
                className="address-input"
                type="text"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={viaTunnel ? "" : address}
                disabled={viaTunnel}
                onChange={(event) => setAddress(event.target.value)}
                placeholder={viaTunnel ? "via túnel" : "192.168.10.103"}
                aria-label="Vehicle IP address"
              />
              <button
                type="submit"
                className="connect-button"
                disabled={connecting || (!viaTunnel && !address.trim())}
              >
                {connected ? "Disconnect" : "Connect"}
              </button>
            </form>
          </div>
        </header>

        <div className="preview-wrap" aria-labelledby="preview-title">
          <div className="vehicle-preview" role="img" aria-label="GPS-style view of the vehicle with its driven path">
            <span className="preview-compass" aria-hidden="true">N</span>

            <div className="preview-world">
              <div className="preview-grid" aria-hidden="true" />
              <svg className="preview-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {routePoints && (
                  <>
                    <polyline className="preview-route-casing" points={routePoints} />
                    <polyline className="preview-route-line" points={routePoints} />
                    <polyline className="preview-route-dash" points={routePoints} />
                  </>
                )}
              </svg>
              <div
                className="preview-car"
                style={{
                  left: `${car.x}%`,
                  top: `${car.y}%`,
                  transform: `translate(-50%, -50%) rotate(${car.heading}deg)`,
                }}
              >
                <CarTopIcon />
              </div>
            </div>

            <button type="button" className="preview-reset" onClick={resetCar} aria-label="Reset preview position">
              <ResetIcon />
            </button>
          </div>
          <p id="preview-title" className="preview-caption">Driving preview</p>
        </div>

        <div className="status-panel" aria-live="polite">
          <div>
            <p className="status-label">Current state</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className={`state-marker ${activeControl ? "moving" : ""}`} />
              <p className="text-lg font-medium tracking-[-0.02em] text-slate-800">{stateLabel}</p>
            </div>
          </div>
          <div className="h-11 w-px bg-slate-200/80" />
          <div className="min-w-[92px] text-right">
            <p className="status-label">Velocity</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-[-0.04em] text-slate-800">
              {speed}
              <span className="ml-1 text-xs font-medium tracking-normal text-slate-400">%</span>
            </p>
          </div>
        </div>

        <div className="controls-grid mt-7 sm:mt-8">
          <DriveButton
            control="forward"
            direction="up"
            label="Accelerate"
            active={activeControl === "forward"}
            className="control-forward"
            onStart={setActiveControl}
            onEnd={stop}
          />
          <DriveButton
            control="left"
            direction="left"
            label="Left"
            active={activeControl === "left"}
            className="control-left"
            onStart={setActiveControl}
            onEnd={stop}
          />

          <button type="button" className="stop-button" onClick={stop} aria-label="Stop vehicle">
            <span className="stop-symbol">
              <span />
            </span>
            <span>STOP</span>
          </button>

          <DriveButton
            control="right"
            direction="right"
            label="Right"
            active={activeControl === "right"}
            className="control-right"
            onStart={setActiveControl}
            onEnd={stop}
          />
          <DriveButton
            control="reverse"
            direction="down"
            label="Decelerate"
            active={activeControl === "reverse"}
            className="control-reverse"
            onStart={setActiveControl}
            onEnd={stop}
          />
        </div>

        <footer className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          Commands are sent while a control is held
        </footer>
      </section>
    </main>
  );
}
