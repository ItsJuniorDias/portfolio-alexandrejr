import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Asset } from "./Asset";
import { scrollStore } from "../lib/scroll-store";
import { cueAt, localProgress, smoothstep } from "../lib/timeline";
import type { Cue } from "../lib/timeline";

function SetPiece({
  kinds,
  children,
  mobile,
  reduced,
}: {
  kinds: Cue["kind"][];
  children: React.ReactNode;
  mobile: boolean;
  reduced: boolean;
}) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const p = scrollStore.getProgress();
    const cue = cueAt(p);
    const local = localProgress(p, cue);
    const visible = kinds.includes(cue.kind);
    ref.current.visible = visible;

    if (!visible) return;

    const enter = reduced ? 1 : smoothstep(0, 0.2, local);
    const leave = reduced ? 0 : smoothstep(0.88, 1, local);
    ref.current.position.set(
      mobile ? 0 : 3.05,
      (mobile ? -0.1 : -3.15) - (1 - enter) * 2.2 - leave * 1.8,
      0,
    );
    ref.current.scale.setScalar((mobile ? 0.8 : 1.3) * (0.92 + enter * 0.08));
    ref.current.rotation.y = reduced ? 0 : -0.12 + Math.sin(local * Math.PI) * 0.15;
    ref.current.rotation.z = reduced ? 0 : (1 - enter) * -0.06;
  });

  return <group ref={ref}>{children}</group>;
}

function TravelingPlane({ reduced }: { reduced: boolean }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const cue = cueAt(scrollStore.getProgress());
    const local = localProgress(scrollStore.getProgress(), cue);
    ref.current.position.set(
      reduced ? 0 : -0.6 + local * 1.25,
      2.7 + (reduced ? 0 : Math.sin(local * Math.PI) * 0.3),
      0.8,
    );
    ref.current.rotation.z = reduced ? 0 : 0.08 - local * 0.12;
  });

  return (
    <group ref={ref}>
      <Asset name="airplane" scale={0.95} />
    </group>
  );
}

export function Scenery({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const common = { mobile, reduced };

  return (
    <>
      <SetPiece kinds={["retail"]} {...common}>
        <Asset name="storefront" position={[-0.9, 0, -0.8]} scale={0.85} rotation={[0, 0.15, 0]} />
        <Asset name="phone" position={[0.85, -0.05, 0.65]} rotation={[0, -0.18, -0.04]} />
        <Asset name="token" position={[-1.3, 0.15, 1.1]} />
        <Asset name="token" position={[-0.65, 0.05, 1.3]} scale={0.7} />
      </SetPiece>
      <SetPiece kinds={["finance"]} {...common}>
        <Asset name="phone" position={[-0.4, 0, 0]} rotation={[0, -0.12, -0.05]} />
        <Asset name="terminal" position={[1.15, 0, 0.7]} scale={0.75} rotation={[0, -0.22, 0.08]} />
        <Asset name="token" position={[-1.6, 0.4, 0.8]} />
        <Asset name="token" position={[1.5, 2.5, -0.3]} scale={0.7} />
      </SetPiece>
      <SetPiece kinds={["travel"]} {...common}>
        <Asset name="phone" position={[0, 0, 0]} scale={0.85} />
        <Asset name="cloud" position={[-1.5, 1.7, -0.4]} scale={0.65} />
        <Asset name="cloud" position={[1.55, 0.7, 0.3]} scale={0.52} />
        <TravelingPlane reduced={reduced} />
      </SetPiece>
      <SetPiece kinds={["education"]} {...common}>
        <Asset name="book" position={[0, 0.08, 0]} scale={1.15} rotation={[0.25, 0, 0]} />
        <Asset name="academy" position={[0, 0.4, -0.1]} scale={0.94} />
        <Asset
          name="certificate"
          position={[1.15, 1.8, 0.6]}
          scale={0.53}
          rotation={[0, -0.1, -0.17]}
        />
      </SetPiece>
      <SetPiece kinds={["music"]} {...common}>
        <Asset name="music" position={[0.5, 0.35, 0]} rotation={[0, -0.15, -0.12]} />
        <Asset name="phone" position={[-1.2, -0.05, 0.8]} scale={0.72} rotation={[0, 0.12, 0.1]} />
      </SetPiece>
      <SetPiece kinds={["game"]} {...common}>
        <Asset name="book" scale={1.1} />
        {[-1, 0, 1].map((i) => (
          <Asset
            key={i}
            name="game-card"
            position={[i * 1.12, 0.6 + (i === 0 ? 0.6 : 0), i === 0 ? 0.3 : 0]}
            rotation={[0, i * -0.14, i * -0.17]}
            scale={1.25}
          />
        ))}
        <Asset name="token" position={[-1.3, 0.15, 1.3]} />
        <Asset name="token" position={[1.2, 0.1, 1.5]} />
      </SetPiece>
      <SetPiece kinds={["security"]} {...common}>
        <Asset name="shield" scale={1.15} />
        <Asset name="token" position={[-1.5, 0.35, 0.5]} />
        <Asset name="token" position={[1.5, 1, -0.5]} scale={0.8} />
      </SetPiece>
      <SetPiece kinds={["letter"]} {...common}>
        <Asset name="envelope" position={[mobile ? 0 : -2.6, -0.7, -1]} scale={1.2} />
      </SetPiece>
      <SetPiece kinds={["contact"]} {...common}>
        <Asset name="envelope" position={[0, 0.3, 0]} rotation={[0, -0.18, -0.08]} scale={1.2} />
        <Asset name="letter" position={[0.2, 1.1, -0.2]} rotation={[0, 0, 0.1]} scale={0.65} />
      </SetPiece>
    </>
  );
}
