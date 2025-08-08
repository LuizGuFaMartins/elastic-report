import { Injectable } from '@nestjs/common';
import { ParserService } from '../../../../domain/abstracts/parser.service';

@Injectable()
export class UserActivitiesParser extends ParserService {
  parse(data) {
    const aggregations = data?.aggregations || {};

    return {
      usage: this.transformTopUsers(aggregations?.top_users || []),
      errorUsers: this.transformTopErrorUsers(
        aggregations?.top_error_users || [],
      ),
      sensitiveAccess: this.transformSensitiveEndpoints(
        aggregations?.sensitive_endpoints_access || [],
      ),
      suspiciousIPs: this.transformSuspiciousIPs(
        aggregations.suspicious_ips || [],
      ),
    };
  }

  transformTopUsers(data) {
    const topUserBuckets = data?.buckets || [];

    const totalRequests = topUserBuckets.reduce(
      (sum, user) => sum + (user.total_requests?.value || 0),
      0,
    );

    const topUsers = topUserBuckets.map((user) => ({
      user: user.key,
      requests: this.formatNumber(user.total_requests?.value),
      percentage: this.formatPercent(
        (user.total_requests?.value || 0) / totalRequests,
      ),
    }));

    const suspiciousActivity = topUserBuckets
      .filter((user) => {
        const methods = user.methods_used?.buckets || [];
        const deletes = methods.find((m) => m.key === 'DELETE')?.doc_count || 0;
        const put = methods.find((m) => m.key === 'PUT')?.doc_count || 0;
        const errors = user.error_count?.doc_count || 0;
        return deletes > 5 || put > 100 || errors > 50;
      })
      .map((user) => {
        const methods = user.methods_used?.buckets || [];
        const deletes = methods.find((m) => m.key === 'DELETE')?.doc_count || 0;
        const put = methods.find((m) => m.key === 'PUT')?.doc_count || 0;
        const errors = user.error_count?.doc_count || 0;

        let type = '';
        let details = '';

        if (deletes > 5) {
          type = 'DELETE excessivo';
          details = `${user.key} realizou ${deletes} requisições DELETE`;
        } else if (put > 100) {
          type = 'PUT anormal';
          details = `${user.key} realizou ${put} requisições PUT`;
        } else if (errors > 50) {
          type = 'Erros elevados';
          details = `${user.key} causou ${errors} erros`;
        }

        return {
          type,
          details,
          timestamp: new Date().toISOString(),
        };
      });

    return {
      topUsers,
      suspiciousActivity,
    };
  }

  transformTopErrorUsers(data) {
    const users = data?.users?.buckets || [];

    const errorUsers = users.map((user) => {
      const errorCodes = (user.error_breakdown?.buckets || []).map(
        (bucket) => ({
          code: bucket.key,
          count: this.formatNumber(bucket.doc_count),
        }),
      );

      const failedEndpoints =
        user.most_failed_endpoints?.buckets?.map((endpoint) => ({
          endpoint: endpoint.key,
          count: this.formatNumber(endpoint.doc_count),
        })) || [];

      return {
        user: user.key,
        totalErrors: this.formatNumber(user.doc_count),
        errorCodes,
        failedEndpoints,
      };
    });

    return errorUsers;
  }

  formatPercentage(success, total) {
    if (!total) return '0%';
    return `${((success / total) * 100).toFixed(1)}%`;
  }

  transformSensitiveEndpoints(data) {
    const users = data?.by_user?.buckets || [];

    const sensitiveAccess = {
      users: users.map((user) => {
        const totalAccesses = user.doc_count;

        const endpoints =
          user.endpoints_accessed?.buckets?.map((ep) => ({
            endpoint: ep.key,
            count: this.formatNumber(ep.doc_count),
          })) || [];

        const success = user.success_rate?.buckets?.success?.doc_count || 0;
        const total = user.success_rate?.buckets?.total?.doc_count || 0;

        return {
          user: user.key,
          totalAccesses: this.formatNumber(totalAccesses),
          endpoints,
          successRate: this.formatPercentage(success, total),
        };
      }),
    };

    return sensitiveAccess;
  }

  transformSuspiciousIPs(data) {
    const buckets = data?.buckets || [];

    const suspiciousIPs = buckets.map((entry) => {
      const totalRequests = entry.doc_count;
      const uniqueUsers = entry.unique_users?.value || 0;
      const errorCount = entry.error_rate?.buckets?.errors?.doc_count || 0;
      const total = entry.error_rate?.buckets?.total?.doc_count || 0;

      const topEndpoints =
        entry.top_endpoints?.buckets?.map((ep) => ({
          endpoint: ep.key,
          count: this.formatNumber(ep.doc_count),
        })) || [];

      return {
        ip: entry.key,
        totalRequests: this.formatNumber(totalRequests),
        uniqueUsers: this.formatNumber(uniqueUsers),
        errorRate: this.formatPercentage(errorCount, total),
        topEndpoints,
      };
    });

    return suspiciousIPs;
  }
}
