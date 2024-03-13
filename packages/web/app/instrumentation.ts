import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerOTel } from '@vercel/otel';

export function register() {
  const exporter = new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  });

  registerOTel({ serviceName: 'api-proxy', traceExporter: exporter });
}
