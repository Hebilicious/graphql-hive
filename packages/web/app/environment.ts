import fs from 'node:fs';
import path from 'node:path';

// todo: try to dynamically generate this list based on `@/env/frontend`
configureRuntimeEnv([
  'NODE_ENV',
  'ENVIRONMENT',
  'APP_BASE_URL',
  'GRAPHQL_PUBLIC_ENDPOINT',
  'GRAPHQL_PUBLIC_ORIGIN',
  'GA_TRACKING_ID',
  'DOCS_URL',
  'STRIPE_PUBLIC_KEY',
  'RELEASE',
  'AUTH_REQUIRE_EMAIL_VERIFICATION',
  'GRAPHQL_PERSISTED_OPERATIONS',
  'ZENDESK_SUPPORT',
  'INTEGRATION_SLACK',
  'AUTH_GITHUB',
  'AUTH_GOOGLE',
  'AUTH_OKTA',
  'AUTH_OKTA_HIDDEN',
  'AUTH_ORGANIZATION_OIDC',
  'SENTRY',
  'SENTRY_DSN',
  'MEMBER_ROLES_DEADLINE',
]);

//
// Runtime environment in Next.js
//

// Writes the environment variables to public/__ENV.js file and make them accessible under `window.__ENV`
function configureRuntimeEnv(publicEnvVars: string[]) {
  const envObject: Record<string, unknown> = {};

  for (const key in process.env) {
    if (publicEnvVars.includes(key)) {
      envObject[key] = process.env[key];
    }
  }

  const base = fs.realpathSync(process.cwd());
  const file = `${base}/public/__ENV.js`;
  const content = `window.__ENV = ${JSON.stringify(envObject)};`;
  const dirname = path.dirname(file);

  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }

  fs.writeFileSync(file, content);
}
