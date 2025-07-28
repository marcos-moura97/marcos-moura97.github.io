import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";

function generateBalls() {
  const loader = new THREE.FontLoader();

  const initial_x = -4;
  const initial_y = 0;
  const initial_z = -3;

  return new Promise((resolve, reject) => {
    loader.load(
      "https://unpkg.com/three@0.126.1/examples/fonts/helvetiker_regular.typeface.json",
      function (font) {
        const texts = [];
        const contents = ["About Me", "Study", "Work", "Papers", "Projects"];

        for (let i = 0; i < 5; ++i) {
          const geometry = new THREE.TextGeometry(`${contents[i]}`, {
            font: font,
            size: 0.5,
            height: 0.1,
            curveSegments: 12,
            bevelEnabled: false,
          });

          const material = new THREE.MeshLambertMaterial({
            color: new THREE.Color(`hsl(${Math.random() * 360}, 80%, 50%)`),
          });

          const textMesh = new THREE.Mesh(geometry, material);
          textMesh.name = contents[i]; // .name is an existing property, often used for IDs
          textMesh.userData.label = contents[i]; // .userData is a free-form object for any extra metadata

          textMesh.position.set(2 * i + initial_x, initial_y, initial_z); // Spacing text along X-axis
          textMesh.rotation.x = -Math.PI / 2; // Rotate to lay flat on XZ plane
          textMesh.rotation.z = Math.PI / 2; // Rotate to lay flat on XZ plane
          textMesh.receiveShadow = true;

          texts.push(textMesh);
        }
        resolve(texts);
      },
      undefined,
      (error) => reject(error)
    );
  });
}

export default generateBalls;
