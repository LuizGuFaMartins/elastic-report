interface Endpoints {
  highestLatency?: {
    name?: string;
    latency?: string;
    volume?: string;
  }[];
  highestErrors?: {
    name?: string;
    errorRate?: string;
    totalErrors?: string;
  }[];
}
