export class RunningStats {
  private count: number = 0;
  private mean: number = 0;
  private m2: number = 0; // Sum of squares of differences from the current mean

  push(value: number): void {
    this.count += 1;
    const delta = value - this.mean;
    this.mean += delta / this.count;
    const delta2 = value - this.mean;
    this.m2 += delta * delta2;
  }

  getMean(): number {
    return this.count > 0 ? this.mean : 0;
  }

  getVariance(): number {
    return this.count > 1 ? this.m2 / (this.count - 1) : 0;
  }

  getStdDev(): number {
    return Math.sqrt(this.getVariance());
  }

  getZScore(value: number): number {
    if (this.count < 2) return 0; // Not enough data for meaningful z-score
    const stdDev = this.getStdDev();
    if (stdDev === 0) return 0; // No variance
    return (value - this.mean) / stdDev;
  }

  getCount(): number {
    return this.count;
  }
}
