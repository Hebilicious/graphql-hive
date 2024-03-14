import { NextApiRequest, NextApiResponse } from 'next';
import type { TracingInstance } from '@hive/service-common/tracing';

export type HandlerFn = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function wrapWithTracing(tracing: TracingInstance | undefined, fn: HandlerFn): HandlerFn {
  if (tracing) {
    return (req, res) => {
      const context = tracing.propagation.extract(tracing.context.active(), req.headers);

      return tracing.context.with(context, () => fn(req, res));
    };
  }

  return fn;
}
