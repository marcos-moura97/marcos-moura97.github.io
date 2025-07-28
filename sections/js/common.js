document.querySelector(".maximize").onclick = () => {
  window.parent.postMessage({ action: "center-camera" }, "*");
};

document.querySelector(".close").onclick = () => {
  window.parent.postMessage({ action: "close-info-screen" }, "*");
};
