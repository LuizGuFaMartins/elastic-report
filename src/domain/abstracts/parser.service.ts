export abstract class ParserService {
  abstract parse(data: any, ...args: any[]): any;

  protected formatNumber(value: number): string {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}k`;
    }
    return value.toString();
  }

  protected formatTime(milliseconds: number): string {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    const ms = milliseconds % 1000;

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);
    if (seconds > 0) parts.push(`${seconds}s`);
    if (milliseconds < 1000 && ms > 0) parts.push(`${ms}ms`);

    return parts.join(' ');
  }

  protected formatPercent(value) {
    return `${(value * 100).toFixed(2)}%`;
  }
}
