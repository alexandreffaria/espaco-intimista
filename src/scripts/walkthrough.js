/* The walkthrough only downloads when you scroll to it: the src is held
   back until the video is on screen, and paused again when it leaves. */
export function mountWalkthrough() {
  const video = document.querySelector('.phone video');
  if (!video) return;

  const src = video.getAttribute('src');
  video.removeAttribute('src');

  if (!('IntersectionObserver' in window)) {
    video.setAttribute('controls', '');
    video.setAttribute('src', src);
    return;
  }

  const play = () => {
    if (!video.getAttribute('src')) {
      video.setAttribute('src', src);
      video.load();
    }
    /* autoplay can still be refused — then the viewer gets the controls */
    video.play()?.catch(() => video.setAttribute('controls', ''));
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) play();
        else if (video.getAttribute('src')) video.pause();
      });
    },
    { threshold: 0.35 }
  );

  io.observe(video);
}
