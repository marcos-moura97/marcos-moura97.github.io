// === robot_scene_app.js ===
import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "https://cdn.jsdelivr.net/npm/three@0.126.1/examples/jsm/renderers/CSS3DRenderer.js";
import { OrbitControls } from "https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js";
import createRobot from "./robot.js";
import PickHelper from "./pick_helper.js";
import generateBalls from "./ball.js";
import Goal from "./goal.js";
import SelectedValueProxy from "./selected_value_proxy.js";

class RobotSceneApp {
  constructor(canvasId = "#c") {
    this.canvas = document.querySelector(canvasId);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.shadowMap.enabled = true;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x404040);
    this.camera = this.createCamera();
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.cssRenderer = this.createCSSRenderer();

    this.sceneRoot = new THREE.Group();
    this.sceneRoot.position.set(5, 0, -8);
    this.sceneRoot.rotation.set(Math.PI, -Math.PI / 2, Math.PI);
    this.scene.add(this.sceneRoot);

    this.pickHelper = new PickHelper();
    this.pickPosition = { x: -100000, y: -100000 };

    this.robotArm = createRobot();
    this.sceneRoot.add(this.robotArm);
    this.goal = new Goal();
    this.infoScreen = null;
    this.texts = [];

    this.selectedBall = new SelectedValueProxy(null, (newVal, oldVal) => {
      this.showInfoScreen(newVal);
    });

    this.initScene();
    this.addEventListeners();
    this.animate(0);
  }

  createCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(10, 10, 5);
    return camera;
  }

  createCSSRenderer() {
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    `;
    document.body.appendChild(cssRenderer.domElement);
    return cssRenderer;
  }

  initScene() {
    this.addLights();
    this.addGrid();
    this.loadBalls();
  }

  addLights() {
    const dLight1 = new THREE.DirectionalLight(0xffffff, 6);
    dLight1.position.set(-1, 2, 4);
    this.scene.add(dLight1);

    const dLight2 = new THREE.DirectionalLight(0xffffff, 6);
    dLight2.position.set(1, -2, -4);
    this.scene.add(dLight2);

    const pointLight = new THREE.PointLight(0xffffff, 3);
    pointLight.position.set(0, 10, 0);
    pointLight.castShadow = true;
    this.scene.add(pointLight);
  }

  addGrid() {
    const grid = new THREE.GridHelper(12, 12, 0xffffff, 0xffffff);
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    grid.material.depthWrite = false;
    this.sceneRoot.add(grid);
  }

  async loadBalls() {
    try {
      this.texts = await generateBalls();
      this.texts.forEach((text) => this.sceneRoot.add(text));
    } catch (err) {
      console.error("Failed to load balls:", err);
    }
  }

  showInfoScreen(ball) {
    if (!ball) return;
    if (this.infoScreen) this.scene.remove(this.infoScreen);

    const iframe = document.createElement("iframe");
    const map = {
      "About Me": "about-me",
      Study: "study",
      Work: "work",
      Papers: "articles",
      Projects: "projects",
    };
    iframe.src = `sections/${map[ball.name] || "default"}.html`;
    iframe.style.border = "0";
    iframe.width = "800";
    iframe.height = "600";
    iframe.style.pointerEvents = "auto";

    this.infoScreen = new CSS3DObject(iframe);
    this.infoScreen.position.set(5, 5, -3);
    this.infoScreen.scale.set(0.01, 0.01, 0.01);
    this.scene.add(this.infoScreen);
  }

  addEventListeners() {
    window.addEventListener("mousemove", (e) => this.setPickPosition(e));
    window.addEventListener("mouseout", () => this.clearPickPosition());
    window.addEventListener("mouseleave", () => this.clearPickPosition());
    window.addEventListener("pointerdown", () => this.pickBall());
    window.addEventListener("message", (e) => this.handleIframeMessage(e));

    this.canvas.addEventListener("pointerdown", (e) => {
      this.setPickPosition(e);
      if (this.texts.length > 0) {
        this.pickHelper.tryPick(
          this.pickPosition,
          this.scene,
          this.camera,
          this.texts
        );
      }
    });
    this.canvas.addEventListener("pointerup", () =>
      this.pickHelper.clearPickedObject()
    );
  }

  setPickPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * this.canvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * this.canvas.height) / rect.height;
    this.pickPosition.x = (x / this.canvas.width) * 2 - 1;
    this.pickPosition.y = -(y / this.canvas.height) * 2 + 1;
  }

  clearPickPosition() {
    this.pickPosition.x = -100000;
    this.pickPosition.y = -100000;
  }

  animate = (time) => {
    time *= 0.001;
    if (this.resizeRenderer()) {
      this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
      this.camera.updateProjectionMatrix();
    }
    this.pickHelper.updateFlash(time);
    this.renderer.render(this.scene, this.camera);
    this.cssRenderer.render(this.scene, this.camera);
    this.controls.update();
    requestAnimationFrame(this.animate);
  };

  resizeRenderer() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.cssRenderer.setSize(width, height);
    }
    return needResize;
  }

  handleIframeMessage(event) {
    const data = event.data;
    if (!this.infoScreen) return;
    switch (data.action) {
      case "center-camera":
        this.camera.position.set(10, 10, 5);
        break;
      case "close-info-screen":
        this.scene.remove(this.infoScreen);
        this.infoScreen = null;
        this.selectedBall.value = null;
        break;
    }
  }

  pickBall() {
    if (!this.pickHelper.pickedObject) return;
    const robotHand =
      this.robotArm.children[3].children[0].children[2].children[0].children[4];
    const lowerArm = this.robotArm.children[3];
    const upperArm = this.robotArm.children[3].children[0].children[2];

    let ballObj = this.pickHelper.pickedObject.object;
    let fps = 60;
    let tau = 2;
    const step = 1 / (tau * fps);
    let angle = Math.atan2(ballObj.position.z, ballObj.position.x);
    const boxDist = upperArm.position.distanceTo(
      robotHand.children[14].position
    );
    const handDist = upperArm.position.distanceTo(
      robotHand.children[4].position
    );
    const corrAngle = Math.acos(boxDist / handDist);
    let rotationAngle = angle + corrAngle;
    const angleStep = rotationAngle * step;
    let t = 0;
    let initialTheta = Math.PI / 3;
    let initialAlpha = -Math.PI / 4;

    const calculateAngles = () => {
      const pToC = lowerArm.position.distanceTo(ballObj.position);
      const cToC = lowerArm.position.distanceTo(upperArm.position);
      const cToH = upperArm.position.distanceTo(robotHand.children[5].position);
      let alpha = Math.acos(
        (cToC ** 2 + pToC ** 2 - cToH ** 2) / (2 * cToC * pToC)
      );
      alpha = Math.PI / 2 - alpha - initialAlpha + 0.3;
      let theta = Math.acos(
        (cToH ** 2 + cToC ** 2 - pToC ** 2) / (2 * cToH * cToC)
      );
      theta = Math.PI / 2 - theta - (Math.PI / 2 - initialTheta) + 0.1;
      return [theta, alpha];
    };

    const calculateRingAngles = () => {
      const rToC = this.goal.getMesh().position.distanceTo(lowerArm.position);
      const cToC = lowerArm.position.distanceTo(upperArm.position);
      const cToH = upperArm.position.distanceTo(robotHand.children[5].position);
      let alpha = Math.acos(
        (cToC ** 2 + rToC ** 2 - cToH ** 2) / (2 * cToC * rToC)
      );
      alpha = Math.PI / 2 - alpha - initialAlpha - Math.PI / 7;
      let theta = Math.acos(
        (cToH ** 2 + cToC ** 2 - rToC ** 2) / (2 * cToH * cToC)
      );
      theta = Math.PI / 2 - theta - (Math.PI / 2 - initialTheta) + 0.1;
      return [theta, alpha];
    };

    const [theta, alpha] = calculateAngles();
    const alphaStep = alpha * step;
    const thetaStep = theta * step;
    const [thetaRing, alphaRing] = calculateRingAngles();
    const alphaRStep = alphaRing * step;
    const thetaRStep = thetaRing * step;
    const angleRStep = corrAngle * step;

    const animateRobotArm = () => {
      let ballPicked = false;
      const update = () => {
        if (t >= 1 && !ballPicked) {
          ballPicked = true;
          robotHand.add(ballObj);
          ballObj.position.set(0.8, 7.38, -0.79);
        }

        if (ballPicked) {
          if (t >= 2) {
            if (t >= 3) {
              robotHand.remove(ballObj);
              ballObj.position.copy(
                this.pickHelper.pickedObject.originalPosition
              );
              this.pickHelper.clearPickedObject();
              this.sceneRoot.add(ballObj);
              if (t >= 4) {
                t = 0;
                this.pickHelper.picked();
                ballPicked = false;
                document.removeEventListener("pointerdown", stopClick);
                return;
              }
              t += step;
              this.robotArm.rotation.y += angleRStep;
              lowerArm.rotateZ(alphaRStep);
              upperArm.rotateZ(thetaRStep);
              robotHand.children[robotHand.children.length - 1].visible = false;
              this.selectedBall.value = ballObj;
            } else {
              t += step;
              this.robotArm.rotation.y -= angleRStep;
              lowerArm.rotateZ(-alphaRStep);
              upperArm.rotateZ(-thetaRStep);
            }
          } else {
            t += step;
            this.robotArm.rotation.y += angleStep;
            lowerArm.rotateZ(alphaStep);
            upperArm.rotateZ(thetaStep);
          }
        } else {
          document.addEventListener("pointerdown", stopClick);
          t += step;
          this.robotArm.rotation.y -= angleStep;
          lowerArm.rotateZ(-alphaStep);
          upperArm.rotateZ(-thetaStep);
        }
        requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    animateRobotArm();
  }
}

function stopClick(e) {
  e.stopPropagation();
  e.preventDefault();
}

new RobotSceneApp();
