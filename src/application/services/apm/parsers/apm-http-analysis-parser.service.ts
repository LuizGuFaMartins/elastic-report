import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class ApmHttpAnalysisParser extends ParserService {
  parse(data) {
    const aggs = data.aggregations || {};

    return {
      total: aggs.http_errors?.doc_count || 0,
      paths:
        aggs.http_errors?.paths?.buckets?.map((p) => ({
          path: p.key,
          count: p.doc_count,
        })) || [],
      methods:
        aggs.http_errors?.methods?.buckets?.map((m) => ({
          method: m.key,
          count: m.doc_count,
        })) || [],
      userAgents:
        aggs.http_errors?.user_agents?.buckets?.map((u) => ({
          agent: u.key,
          count: u.doc_count,
        })) || [],
    };
  }
}
