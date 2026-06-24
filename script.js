console.log("✅ script.js carregou");

const API_BASE = "https://automo-o-com-ia-para-post-no-intagram.onrender.com";

function $(id) {
  return document.getElementById(id);
}

let LAST_STORY_BLOB = null;
let LAST_STORY_CREATED_AT = 0;

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded - registrando eventos");

  const badgeInput = $("badge");
  const titleInput = $("title");
  const priceInput = $("price");
  const cityInput = $("city");
  const districtInput = $("district");
  const areaInput = $("area");
  const descInput = $("description");
  const contactInput = $("contact");
  const featureInputs = document.querySelectorAll(".feature");
  const storyFeatures = $("story-features");
  const imageFitSelect = $("image-fit");
  const containBgSelect = $("contain-bg");
  const posX = $("pos-x");
  const posY = $("pos-y");

  const storyBadge = $("story-badge");
  const storyTitle = $("story-title");
  const storyPrice = $("story-price");
  const storyLocation = $("story-location");
  const storyArea = $("story-area");
  const storyDescription = $("story-description");
  const storyContact = $("story-contact");

  const storyImage = $("story-image-preview");
  const storyBgBlur = $("story-bg-blur");

  function updatePreviewText() {
    if (storyBadge) storyBadge.textContent = badgeInput?.value || "IMÓVEL À VENDA";
    if (storyTitle) storyTitle.textContent = titleInput?.value || "Título do imóvel";
    if (storyPrice) storyPrice.textContent = priceInput?.value || "R$ 0,00";

    if (storyLocation) {
      storyLocation.textContent = `${districtInput?.value || "Região"} - ${cityInput?.value || "Cidade"}`;
    }

    if (storyArea) storyArea.textContent = areaInput?.value || "Área";
    if (storyDescription) storyDescription.textContent = descInput?.value || "Descrição";
    if (storyContact) storyContact.textContent = contactInput?.value || "@assessoriaimobiliaria";
    if (storyFeatures) {
  const selected = [...featureInputs]
    .filter(item => item.checked)
    .map(item => item.value);

  storyFeatures.innerHTML = selected
    .slice(0,4)
    .map(item => `<span>${item}</span>`)
    .join("");
  }
  }

  [
    badgeInput,
    titleInput,
    priceInput,
    cityInput,
    districtInput,
    areaInput,
    descInput,
    contactInput,
  ].forEach((el) => el && el.addEventListener("input", updatePreviewText));

  updatePreviewText();

  function applyImageSettings() {
    if (!storyImage) return;

    const fit = imageFitSelect?.value || "cover";
    const x = `${posX?.value ?? 50}%`;
    const y = `${posY?.value ?? 50}%`;

    storyImage.style.objectFit = fit;
    storyImage.style.objectPosition = `${x} ${y}`;

    const useBg = (containBgSelect?.value ?? "true") === "true";
    const shouldShowBg = fit === "contain" && useBg && storyImage.src;

    if (storyBgBlur) {
      if (shouldShowBg) {
        storyBgBlur.classList.remove("hidden");
        storyBgBlur.style.backgroundImage = `url('${storyImage.src}')`;
      } else {
        storyBgBlur.classList.add("hidden");
        storyBgBlur.style.backgroundImage = "";
      }
    }
  }

  [imageFitSelect, containBgSelect, posX, posY].forEach((el) =>
    el && el.addEventListener("input", applyImageSettings)
  );

  [imageFitSelect, containBgSelect].forEach((el) =>
    el && el.addEventListener("change", applyImageSettings)
  );

  $("image-upload-story")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file || !storyImage) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      storyImage.crossOrigin = "anonymous";
      storyImage.src = ev.target.result;
      storyImage.classList.remove("hidden");
      applyImageSettings();

      LAST_STORY_BLOB = null;
      LAST_STORY_CREATED_AT = 0;
    };

    reader.readAsDataURL(file);
  });

  $("logo-upload-story")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      const img = $("story-logo-preview");
      if (!img) return;

      img.crossOrigin = "anonymous";
      img.src = ev.target.result;
      img.classList.remove("hidden");

      LAST_STORY_BLOB = null;
      LAST_STORY_CREATED_AT = 0;
    };

    reader.readAsDataURL(file);
  });

  $("buscar-imagem-ia")?.addEventListener("click", async (e) => {
    e.preventDefault();

    const url = $("imovel-url")?.value?.trim();
    if (!url) return alert("Cole a URL do imóvel");

    try {
      const res = await fetch(`${API_BASE}/analisar-imovel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Backend erro:", data);
        return alert(data?.erro || "Erro no backend");
      }

      if (!data.imagem) return alert("Não veio imagem do backend.");

      storyImage.crossOrigin = "anonymous";
      storyImage.src = data.imagem;
      storyImage.classList.remove("hidden");
      applyImageSettings();

      LAST_STORY_BLOB = null;
      LAST_STORY_CREATED_AT = 0;
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar imagem no backend online. Veja o Console F12.");
    }
  });

  function withTimeout(promise, ms, label = "operação") {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout em ${label} (${ms}ms)`)), ms)
      ),
    ]);
  }

  async function waitForImages(container, timeoutMs = 6000) {
    const imgs = [...container.querySelectorAll("img")].filter((img) => img.src);

    const perImgPromises = imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();

      return withTimeout(
        new Promise((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
        timeoutMs,
        "carregamento de imagem"
      ).catch(() => {
        console.warn("⚠️ Imagem travou e foi ignorada:", String(img.src).slice(0, 140));
      });
    });

    await Promise.all(perImgPromises);
  }

  function stripHeavyCssForExport(root) {
    try {
      root.querySelectorAll("*").forEach((el) => {
        el.style.setProperty("backdrop-filter", "none", "important");
        el.style.setProperty("-webkit-backdrop-filter", "none", "important");
        el.style.setProperty("filter", "none", "important");
        el.style.setProperty("clip-path", "none", "important");
      });

      const blur = root.querySelector("#story-bg-blur");
      if (blur) blur.remove();
    } catch (e) {
      console.warn("stripHeavyCssForExport falhou:", e);
    }
  }

  async function gerarStoryPngDataUrl() {
    if (typeof domtoimage === "undefined") {
      throw new Error("domtoimage não carregou.");
    }

    const story = $("story-preview-wrapper");
    if (!story) throw new Error("Não achei #story-preview-wrapper no HTML.");

    if (document.fonts?.ready) {
      await withTimeout(document.fonts.ready, 6000, "fontes");
    }

    await waitForImages(story, 6000);

    const dataUrl = await withTimeout(
      domtoimage.toPng(story, {
        width: 1080,
        height: 1920,
        cacheBust: true,
        onclone: (clonedDoc) => {
          const clonedStory = clonedDoc.getElementById("story-preview-wrapper");
          if (clonedStory) stripHeavyCssForExport(clonedStory);
        },
        style: {
          transform: "none",
          width: "1080px",
          height: "1920px",
          overflow: "hidden",
        },
      }),
      20000,
      "geração do PNG"
    );

    if (!dataUrl || !dataUrl.startsWith("data:image/png")) {
      throw new Error("PNG inválido.");
    }

    return dataUrl;
  }

  async function dataUrlToBlob(dataUrl) {
    const res = await fetch(dataUrl);
    return await res.blob();
  }

  const downloadBtn = $("download-story");
  const postBtn = $("post-story");

  downloadBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      let handle = null;

      if (window.showSaveFilePicker) {
        handle = await window.showSaveFilePicker({
          suggestedName: "story-assessoria-imobiliaria-1080x1920.png",
          types: [
            {
              description: "PNG Image",
              accept: { "image/png": [".png"] },
            },
          ],
        });
      }

      const dataUrl = await gerarStoryPngDataUrl();
      const blob = await dataUrlToBlob(dataUrl);

      if (handle) {
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      }

      const w = window.open("about:blank", "_blank");
      if (w) {
        w.location.href = dataUrl;
      } else {
        alert("Pop-up bloqueado. Permita pop-ups no navegador.");
      }
    } catch (err) {
      console.error(err);
      alert("Falhou ao baixar PNG: " + (err?.message || err));
    }
  });

  postBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (!isMobile()) {
        let handle = null;

        if (window.showSaveFilePicker) {
          handle = await window.showSaveFilePicker({
            suggestedName: "story-assessoria-imobiliaria-1080x1920.png",
            types: [
              {
                description: "PNG Image",
                accept: { "image/png": [".png"] },
              },
            ],
          });
        }

        const dataUrl = await gerarStoryPngDataUrl();
        const blob = await dataUrlToBlob(dataUrl);

        if (handle) {
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const w = window.open("about:blank", "_blank");
          if (w) w.location.href = dataUrl;
        }

        window.open("https://www.instagram.com/", "_blank");
        alert("PNG salvo. No Instagram: Criar → Story → escolher o arquivo.");
        return;
      }

      const now = Date.now();
      const blobFresh = LAST_STORY_BLOB && now - LAST_STORY_CREATED_AT < 120000;

      if (blobFresh && navigator.share && navigator.canShare) {
        const file = new File([LAST_STORY_BLOB], "story-assessoria-imobiliaria.png", {
          type: "image/png",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Story - Assessoria Imobiliária",
            text: "Postar no Instagram Stories",
          });
          return;
        }
      }

      alert("Gerando o arquivo… quando terminar, clique de novo em 'Postar no Story'.");

      const dataUrl = await gerarStoryPngDataUrl();
      const blob = await dataUrlToBlob(dataUrl);

      LAST_STORY_BLOB = blob;
      LAST_STORY_CREATED_AT = Date.now();

      alert("✅ Pronto! Clique de novo em 'Postar no Story' para abrir o compartilhar.");
    } catch (err) {
      console.error(err);
      alert("Falhou ao postar: " + (err?.message || err));
    }
  });
});