export class StartAnimation {
  constructor() {
    this.container = document.getElementById('startAnimation');
    this.duration = 3500;
  }

  async play() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.container.style.opacity = '0';
        this.container.style.pointerEvents = 'none';
        setTimeout(resolve, 500);
      }, this.duration);
    });
  }
}
