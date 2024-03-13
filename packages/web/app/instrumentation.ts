import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerOTel } from '@vercel/otel';

export function register() {
  if (globalThis['__backend_env'].tracing) {
    const { url } = globalThis['__backend_env'].tracing;
    console.info(`🔎 Registering OpenTelemetry with exporter URL: ${url}`);
    const exporter = new OTLPTraceExporter({ url });
    registerOTel({
      serviceName: 'api-proxy',
      traceExporter: exporter,
      propagators: ['tracecontext'],
    });
  } else {
    console.warn('OpenTelemetry endpoint is missing, ignoring');
  }
}
