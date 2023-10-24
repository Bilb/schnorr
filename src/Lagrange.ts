/**
 * @class Lagrange polynomial interpolation.
 * The computed interpolation polynomial will be referred to as L(x).
 * @example
 * const points = [{x:0, Y:0}, {x:0.5, y:0.8}, {x:1, y:1}];
 * const polynomial = new Lagrange(points);
 * console.log(polynomial.evaluate(0.1));
 */
export class Lagrange {
  private xs: Array<number> = [];
  private ys: Array<number> = [];
  private ws: Array<number> = [];
  private k: number;

  constructor(points: Array<{ x: number; y: number }>) {
    if (!points.length) {
      throw new Error('we need points');
    }
    this.k = points.length;
    points.forEach(({ x, y }) => {
      this.xs.push(x);
      this.ys.push(y);
    });
    for (let w, j = 0; j < this.k; j++) {
      w = 1;
      for (let i = 0; i < this.k; i++)
        if (i !== j) w *= this.xs[j] - this.xs[i];
      this.ws[j] = 1 / w;
    }
  }

  /**
   * Calculate L(x)
   */
  public doEv(x: number) {
    let a = 0;
    let b = 0;
    let c = 0;
    for (let i = 0; i < this.k; i++) {
      if (x === this.xs[i]) return this.ys[i];
      a = this.ws[i] / (x - this.xs[i]);
      b += a * this.ys[i];
      c += a;
    }
    return b / c;
  }
}
