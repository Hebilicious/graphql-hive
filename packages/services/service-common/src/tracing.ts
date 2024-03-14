import { context, propagation, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export function configureTracing(options: {
  collectorEndpoint: string;
  serviceName: string;
  instrumentations: {
    fetch?: boolean;
  };
}) {
  console.info('🛣️  Tracing enabled');
  const exporter = new OTLPTraceExporter({ url: options.collectorEndpoint });

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: options.serviceName,
    }),
    traceExporter: exporter,
    spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
    instrumentations: [getNodeAutoInstrumentations({})],
  });

  const tracer = trace.getTracer(options.collectorEndpoint);

  return {
    sdk,
    propagation,
    context,
    tracer,
  };
}

export type TracingInstance = ReturnType<typeof configureTracing>;
