import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerOTel } from '@vercel/otel';

export function register() {
  if (globalThis['__backend_env'].tracing) {
    const { url } = globalThis['__backend_env'].tracing;
    console.info(`🔎 Registering OpenTelemetry with exporter URL: ${url}`);
    const exporter = new OTLPTraceExporter({ url });

    registerOTel({
      serviceName: 'app',
      traceExporter: exporter,
      
    });
  } else {
    console.warn('OpenTelemetry endpoint is missing, ignoring');
  }
}
