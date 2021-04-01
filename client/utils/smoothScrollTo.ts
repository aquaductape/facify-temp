import { easeInOutQuad } from "./transition";

type smoothScrollToProps = {
  destination: number | HTMLElement;
  container?: Window | HTMLElement;
  duration?: number;
  padding?: number;
  currentPosition?: number;
  onEnd?: Function;
  locked?: { release?: number; forever?: boolean } | boolean;
};

let instances = 0;

const smoothScrollTo = ({
  container = window,
  duration = 400,
  padding = 0,
  destination,
  currentPosition,
  locked: lockedProp = false,
  onEnd,
}: smoothScrollToProps) => {
  if (currentPosition == null)
    currentPosition =
      (container as Window).scrollY != null
        ? (container as Window).scrollY
        : (container as HTMLElement).scrollTop;
  const locked = { x: currentPosition };

  const scrollTo = (x: number) => {
    if (container.scrollTo) return container.scrollTo({ top: x });
    return ((container as HTMLElement).scrollTop! = x);
  };

  const onLockScroll = () => scrollTo(locked.x);
  const setDestination = () => {
    if (typeof destination === "number") {
      destination += padding;
      return;
    }
    // TODO if parent is element, use element.scrollTop instead of window.scrollY, it broke in a particular UI scroll component
    destination =
      destination.getBoundingClientRect().top + window.scrollY + padding;
  };

  const animateScroll = () => {
    let stop = false;

    const startx = currentPosition;
    const destx = destination as number;
    let start: number | null = null;
    let end = null;
    let x = (null as unknown) as number;

    const animate = (timeStamp: number) => {
      start = timeStamp;
      end = start + duration;
      draw(timeStamp);
    };

    const onStop = () => {
      locked.x = destination as number;
      scrollTo(destination as number);

      onEnd && onEnd();

      instances--;

      if (!lockedProp) return;

      if (typeof lockedProp === "boolean") {
        container.removeEventListener("scroll", onLockScroll);
      } else {
        const { forever, release } = lockedProp;

        if (forever) {
          return;
        }

        if (release) {
          setTimeout(() => {
            container.removeEventListener("scroll", onLockScroll);
          }, release);
        } else {
          container.removeEventListener("scroll", onLockScroll);
        }
      }
      return;
    };
    const draw = (now: number) => {
      if (instances > 1) {
        instances--;
        return;
      }

      if (now - start! > duration) {
        onStop();
        return;
      }

      const p = (now - start!) / duration;
      const val = easeInOutQuad(p);
      x = startx! + (destx - startx!) * val;

      locked.x = x;
      scrollTo(x);

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(animate);
  };

  if (lockedProp) {
    container.addEventListener("scroll", onLockScroll);
  }

  instances++;
  setDestination();
  animateScroll();

  if (typeof lockedProp === "boolean") return;
  return onLockScroll;
};

export default smoothScrollTo;
