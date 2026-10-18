function initBgaDemo() {
  const player = document.querySelector("[data-bga-demo]");
  if (!player || player.dataset.ready === "true") return;

  const launch = player.querySelector(".bga-demo-launch");
  const stage = player.querySelector(".bga-demo-stage");
  const video = player.querySelector("video");
  if (!launch || !stage || !video) return;
  player.dataset.ready = "true";

  const reveal = () => {
    if (stage.dataset.revealed === "true") return;
    stage.dataset.revealed = "true";
    launch.tabIndex = -1;
    launch.setAttribute("aria-hidden", "true");
  };

  launch.addEventListener("click", (event) => {
    event.preventDefault();
    if (stage.dataset.loading === "true") return;
    stage.dataset.loading = "true";
    video.muted = true;
    video.hidden = false;
    video.addEventListener("playing", reveal, { once: true });
    video.play().catch(() => {
      reveal();
      video.focus();
    });
  });
}

document.addEventListener("astro:page-load", initBgaDemo);
initBgaDemo();
