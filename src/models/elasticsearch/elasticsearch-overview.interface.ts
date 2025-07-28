interface ElasticsearchOverview {
  aggregations: {
    avg_latency: {
      value: number | null;
    };
    total_requests: {
      value: number;
    };
    error_rate: {
      buckets: {
        total: {
          doc_count: number;
        };
        errors: {
          doc_count: number;
        };
      };
    };
    availability: {
      buckets: {
        total: {
          doc_count: number;
        };
        success: {
          doc_count: number;
        };
      };
    };
    hourly_traffic: {
      buckets: Array<{
        key_as_string: string;
        key: number;
        doc_count: number;
      }>;
    };
    daily_throughput: {
      buckets: Array<{
        key_as_string: string;
        key: number;
        doc_count: number;
      }>;
    };
  };
}
