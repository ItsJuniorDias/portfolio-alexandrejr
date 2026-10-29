import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { EqualStencilFunc, Mesh, MeshStandardMaterial } from "three";
import type { ThreeElements } from "@react-three/fiber";

type AssetProps = ThreeElements["group"] & { name: string };

export function Asset({ name, ...props }: AssetProps) {
  const { scene } = useGLTF(`/assets/models/${name}.glb`);
  const object = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((node) => {
      if (node instanceof Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        if (node.material instanceof MeshStandardMaterial) {
          node.material = node.material.clone();
          node.material.roughness = 0.92;
          node.material.stencilWrite = true;
          node.material.stencilRef = 1;
          node.material.stencilFunc = EqualStencilFunc;
        }
      }
    });

    return clone;
  }, [scene]);

  return (
    <group {...props}>
      <primitive object={object} />
    </group>
  );
}
