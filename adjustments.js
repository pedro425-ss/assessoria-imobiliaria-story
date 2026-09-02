document.addEventListener("DOMContentLoaded", () => {
  const image = document.getElementById("story-image-preview");
  const imageFit = document.getElementById("image-fit");
  const containBg = document.getElementById("contain-bg");
  const posX = document.getElementById("pos-x");
  const posY = document.getElementById("pos-y");
  const zoom = document.getElementById("zoom");
  const zoomValue = document.getElementById("zoom-value");
  const posXValue = document.getElementById("pos-x-value");
  const posYValue = document.getElementById("pos-y-value");
  const resetButton = document.getElementById("reset-adjustments");
  const presetButtons = document.querySelectorAll(".frame-preset");

  if (!image || !posX || !posY || !zoom) return;

  function updateLabels() {
    if (zoomValue) zoomValue.textContent = `${zoom.value}%`;
    if (posXValue) posXValue.textContent = `${posX.value}%`;
    if (posYValue) posYValue.textContent = `${posY.value}%`;
  }

  function applyProfessionalAdjustments() {
    const zoomScale = Number(zoom.value || 100) / 100;
    const x = Number(posX.value || 50);
    const y = Number(posY.value || 50);

    image.style.transformOrigin = `${x}% ${y}%`;
    image.style.transform = `scale(${zoomScale})`;
    updateLabels();
  }

  function notifyMainScript() {
    posX.dispatchEvent(new Event("input", { bubbles: true }));
  }

  zoom.addEventListener("input", () => {
    applyProfessionalAdjustments();
    notifyMainScript();
  });

  [posX, posY].forEach((control) => {
    control.addEventListener("input", applyProfessionalAdjustments);
    control.addEventListener("change", applyProfessionalAdjustments);
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const x = button.dataset.x;
      const y = button.dataset.y;
      if (x != null) posX.value = x;
      if (y != null) posY.value = y;

      posX.dispatchEvent(new Event("input", { bubbles: true }));
      posY.dispatchEvent(new Event("input", { bubbles: true }));
      applyProfessionalAdjustments();
    });
  });

  resetButton?.addEventListener("click", () => {
    if (imageFit) imageFit.value = "cover";
    if (containBg) containBg.value = "true";
    zoom.value = "100";
    posX.value = "50";
    posY.value = "50";

    imageFit?.dispatchEvent(new Event("change", { bubbles: true }));
    containBg?.dispatchEvent(new Event("change", { bubbles: true }));
    posX.dispatchEvent(new Event("input", { bubbles: true }));
    posY.dispatchEvent(new Event("input", { bubbles: true }));

    applyProfessionalAdjustments();
  });

  image.addEventListener("load", applyProfessionalAdjustments);

  applyProfessionalAdjustments();
});