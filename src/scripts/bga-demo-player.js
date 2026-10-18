function initBgaDemo() {
  const player = document.querySelector("[data-bga-demo]");
  if (!player || player.dataset.ready === "true") return;

  const launch = player.querySelector(".bga-demo-launch");
  const video = player.querySelector("video");
  if (!launch || !video) return;
  player.dataset.ready = "true";

  launch.addEventListener("click", async (event) => {
    event.preventDefault();
    launch.hidden = true;
    video.hidden = false;
    try {
      await video.play();
    } catch {
      video.focus();
    }
  });
}

document.addEventListener("astro:page-load", initBgaDemo);
initBgaDemo();
