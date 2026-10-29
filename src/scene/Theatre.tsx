import { Component, Suspense, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Mask, useMask, useTexture } from "@react-three/drei";
import { Group, Mesh, Color, SRGBColorSpace, Shape, ShapeGeometry } from "three";
import { scrollStore } from "../lib/scroll-store";
import { Curtains } from "./Curtains";
import { Scenery } from "./Scenery";

class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.error("Theatre could not load:", error);
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Scene({
  reduced,
  onReady,
  onFailure,
}: {
  reduced: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const { viewport, size, invalidate, gl } = useThree();
  const stage = useRef<Group>(null);
  const wash = useRef<Mesh>(null);
  const [frame, backdrop] = useTexture(
    ["/assets/stage/proscenium.webp", "/assets/stage/workshop.webp"],
    (textures) => {
      (Array.isArray(textures) ? textures : [textures]).forEach((texture) => {
        texture.colorSpace = SRGBColorSpace;
      });
    },
  );
  const mobile = size.width < 700;
  const stencil = useMask(1);
  const aperture = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-6.65, -4.48);
    shape.lineTo(6.65, -4.48);
    shape.lineTo(6.65, 1.8);
    shape.quadraticCurveTo(6.65, 2.9, 4.7, 3.05);
    shape.quadraticCurveTo(0, 3.9, -4.7, 3.05);
    shape.quadraticCurveTo(-6.65, 2.9, -6.65, 1.8);
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);

  useEffect(() => scrollStore.subscribeScene(invalidate), [invalidate]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", onReady);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", onReady);
    };
  }, [gl, onFailure, onReady]);

  useFrame(({ pointer }) => {
    if (!stage.current) return;
    stage.current.rotation.y = reduced || mobile ? 0 : pointer.x * 0.012;
  });

  return (
    <group scale={[viewport.width / 16, viewport.height / 9, 1]}>
      <Mask id={1} geometry={aperture} position={[0, 0, 6]} />
      <ambientLight intensity={1.7} color="#ffe7c4" />
      <directionalLight
        position={[-4, 7, 9]}
        intensity={3.1}
        color="#fff3d6"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-normalBias={0.04}
      />
      <pointLight position={[3, -2.7, 4]} intensity={1.5} color="#ffbe63" distance={12} />
      <mesh position={[0, 0, -3]} receiveShadow>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} {...stencil} />
      </mesh>
      <mesh ref={wash} position={[0, 0, -2.8]}>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial
          color={new Color("#1d3437")}
          transparent
          opacity={0.26}
          depthWrite={false}
          {...stencil}
        />
      </mesh>
      <group ref={stage}>
        <Scenery mobile={mobile} reduced={reduced} />
      </group>
      <Curtains reduced={reduced} />
      <mesh position={[0, 0, 5.1]} renderOrder={10}>
        <planeGeometry args={[16, 9]} />
        <meshBasicMaterial map={frame} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Theatre({
  reduced,
  onReady,
  onFailure,
}: {
  reduced: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  return (
    <SceneBoundary onFailure={onFailure}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 20], zoom: 80, near: 0.1, far: 60 }}
        shadows
        dpr={[1, 1.6]}
        frameloop="demand"
        gl={{ antialias: true, alpha: true, stencil: true, powerPreference: "high-performance" }}
        fallback={<p>Abra o programa para ler o portfólio completo.</p>}
      >
        <Suspense fallback={null}>
          <Scene reduced={reduced} onReady={onReady} onFailure={onFailure} />
        </Suspense>
      </Canvas>
    </SceneBoundary>
  );
}
