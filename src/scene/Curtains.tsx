import { useMemo, useRef } from "react";
import { useMask, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, PlaneGeometry, DoubleSide } from "three";
import { scrollStore } from "../lib/scroll-store";
import { smoothstep } from "../lib/timeline";

function CurtainPanel({ side, reduced }: { side: -1 | 1; reduced: boolean }) {
  const ref = useRef<Group>(null);
  const texture = useTexture("/assets/stage/curtain-suede.webp");
  const stencil = useMask(1);
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(7.5, 8.25, 80, 8);
    const positions = geo.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      positions.setZ(i, Math.cos(x * 8.5) * 0.085);
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const p = scrollStore.getProgress();
    const opened = reduced ? Number(p > 0.03) : smoothstep(0.012, 0.095, p);
    ref.current.position.x = side * (3.67 + opened * 3.18);
    ref.current.scale.x = 1 - opened * 0.68;
    ref.current.rotation.z = side * opened * -0.014;
  });

  return (
    <group ref={ref} position={[side * 3.67, -0.03, 3.8]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial map={texture} roughness={1} side={DoubleSide} {...stencil} />
      </mesh>
    </group>
  );
}

export function Curtains({ reduced }: { reduced: boolean }) {
  return (
    <>
      <CurtainPanel side={-1} reduced={reduced} />
      <CurtainPanel side={1} reduced={reduced} />
    </>
  );
}
