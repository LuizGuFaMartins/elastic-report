import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class ApmErrorsParser extends ParserService {
  parse(data) {
    const aggs = data.aggregations || {};

    return {
      summary: {
        totalErrors: aggs.error_statistics?.count || 0,
        uniqueErrors: aggs.unique_errors?.value || 0,
        affectedUsers: aggs.users_affected?.value || 0,
        unhandledErrors:
          aggs.handled_vs_unhandled?.buckets?.find(
            (b) => b.key_as_string === 'false',
          )?.doc_count || 0,
        severityLevels:
          aggs.error_severity?.buckets?.map((b) => ({
            level: b.key,
            count: b.doc_count,
          })) || [],
      },

      services:
        aggs.services_with_errors?.buckets?.map((service) => ({
          name: service.key,
          errorCount: service.doc_count,
          environment: service.environments?.buckets?.[0]?.key || 'Unknown',
          errorRate: service.error_rate?.value_as_string === 'true',
          topErrors:
            service.top_errors?.buckets?.map((e) => ({
              type: e.key,
              count: e.doc_count,
            })) || [],
        })) || [],

      errorTypes:
        aggs.error_types?.buckets?.map((type) => ({
          type: type.key,
          count: type.doc_count,
          affectedServices:
            type.affected_services?.buckets?.map((s) => ({
              service: s.key,
              count: s.doc_count,
            })) || [],
        })) || [],

      httpAnalysis: {
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
      },

      errorLocations:
        aggs.error_locations?.buckets?.map((loc) => ({
          file: loc.key,
          total: loc.doc_count,
          functions:
            loc.functions?.buckets?.map((f) => ({
              name: f.key,
              count: f.doc_count,
            })) || [],
          lines:
            loc.line_numbers?.buckets?.map((l) => ({
              line: l.key,
              count: l.doc_count,
            })) || [],
        })) || [],

      infrastructure:
        aggs.infrastructure?.buckets?.map((i) => ({
          instance: i.key,
          count: i.doc_count,
          cloudProvider: i.cloud_providers?.buckets?.[0]?.key || 'N/A',
          availabilityZone: i.availability_zones?.buckets?.[0]?.key || 'N/A',
        })) || [],

      traceAnalysis:
        aggs.trace_analysis?.buckets?.map((t) => ({
          trace: t.key,
          count: t.doc_count,
          transactionTypes:
            t.transaction_types?.buckets?.map((tt) => ({
              type: tt.key,
              count: tt.doc_count,
            })) || [],
        })) || [],

      clientAnalysis:
        aggs.client_analysis?.buckets?.map((c) => ({
          clientIP: c.key,
          totalErrors: c.doc_count,
          errorCount: c.error_count_per_client?.value || 0,
        })) || [],
    };
  }
}
