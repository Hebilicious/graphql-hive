import zod from 'zod';
import { getAllEnv } from './read';

// treat an empty string `''` as `undefined`
const emptyString = <T extends zod.ZodType>(input: T) => {
  return zod.preprocess((value: unknown) => {
    if (value === '') return undefined;
    return value;
  }, input);
};

const enabledOrDisabled = emptyString(zod.union([zod.literal('1'), zod.literal('0')]).optional());

// todo: reuse backend schema

const BaseSchema = zod.object({
  NODE_ENV: zod.string(),
  ENVIRONMENT: zod.string(),
  APP_BASE_URL: zod.string().url(),
  GRAPHQL_PUBLIC_ENDPOINT: zod.string().url(),
  GRAPHQL_PUBLIC_ORIGIN: zod.string().url(),
  GA_TRACKING_ID: emptyString(zod.string().optional()),
  DOCS_URL: emptyString(zod.string().url().optional()),
  STRIPE_PUBLIC_KEY: emptyString(zod.string().optional()),
  RELEASE: emptyString(zod.string().optional()),
  AUTH_REQUIRE_EMAIL_VERIFICATION: emptyString(
    zod.union([zod.literal('1'), zod.literal('0')]).optional(),
  ),
  GRAPHQL_PERSISTED_OPERATIONS: emptyString(
    zod.union([zod.literal('1'), zod.literal('0')]).optional(),
  ),
  ZENDESK_SUPPORT: enabledOrDisabled,
});

const IntegrationSlackSchema = zod.object({
  INTEGRATION_SLACK: enabledOrDisabled,
});

const AuthGitHubConfigSchema = zod.object({
  AUTH_GITHUB: enabledOrDisabled,
});

const AuthGoogleConfigSchema = zod.object({
  AUTH_GOOGLE: enabledOrDisabled,
});

const AuthOktaConfigSchema = zod.object({
  AUTH_OKTA: enabledOrDisabled,
  AUTH_OKTA_HIDDEN: enabledOrDisabled,
});

const AuthOktaMultiTenantSchema = zod.object({
  AUTH_ORGANIZATION_OIDC: enabledOrDisabled,
});

const SentryConfigSchema = zod.union([
  zod.object({
    SENTRY: zod.union([zod.void(), zod.literal('0')]),
  }),
  zod.object({
    SENTRY: zod.literal('1'),
    SENTRY_DSN: zod.string(),
  }),
]);

const MigrationsSchema = zod.object({
  MEMBER_ROLES_DEADLINE: emptyString(
    zod
      .date({
        coerce: true,
      })
      .optional(),
  ),
});

const envValues = getAllEnv();

function buildConfig() {
  const configs = {
    base: BaseSchema.safeParse(envValues),
    integrationSlack: IntegrationSlackSchema.safeParse(envValues),
    sentry: SentryConfigSchema.safeParse(envValues),
    authGithub: AuthGitHubConfigSchema.safeParse(envValues),
    authGoogle: AuthGoogleConfigSchema.safeParse(envValues),
    authOkta: AuthOktaConfigSchema.safeParse(envValues),
    authOktaMultiTenant: AuthOktaMultiTenantSchema.safeParse(envValues),
    migrations: MigrationsSchema.safeParse(envValues),
  };

  const environmentErrors: Array<string> = [];

  for (const config of Object.values(configs)) {
    if (config.success === false) {
      environmentErrors.push(JSON.stringify(config.error.format(), null, 4));
    }
  }

  if (environmentErrors.length) {
    const fullError = environmentErrors.join('\n');
    console.error('❌ Invalid (frontend) environment variables:', fullError);
    throw new Error('Invalid environment variables.');
  }

  function extractConfig<Input, Output>(config: zod.SafeParseReturnType<Input, Output>): Output {
    if (!config.success) {
      throw new Error('Something went wrong.');
    }
    return config.data;
  }

  const base = extractConfig(configs.base);
  const integrationSlack = extractConfig(configs.integrationSlack);
  const sentry = extractConfig(configs.sentry);
  const authGithub = extractConfig(configs.authGithub);
  const authGoogle = extractConfig(configs.authGoogle);
  const authOkta = extractConfig(configs.authOkta);
  const authOktaMultiTenant = extractConfig(configs.authOktaMultiTenant);
  const migrations = extractConfig(configs.migrations);

  return {
    appBaseUrl: base.APP_BASE_URL.replace(/\/$/, ''),
    graphqlPublicEndpoint: base.GRAPHQL_PUBLIC_ENDPOINT,
    graphqlPublicOrigin: base.GRAPHQL_PUBLIC_ORIGIN,
    docsUrl: base.DOCS_URL,
    stripePublicKey: base.STRIPE_PUBLIC_KEY ?? null,
    auth: {
      github: authGithub.AUTH_GITHUB === '1',
      google: authGoogle.AUTH_GOOGLE === '1',
      okta: authOkta.AUTH_OKTA === '1' ? { hidden: authOkta.AUTH_OKTA_HIDDEN === '1' } : null,
      requireEmailVerification: base.AUTH_REQUIRE_EMAIL_VERIFICATION === '1',
      organizationOIDC: authOktaMultiTenant.AUTH_ORGANIZATION_OIDC === '1',
    },
    analytics: {
      googleAnalyticsTrackingId: base.GA_TRACKING_ID,
    },
    integrations: {
      slack: integrationSlack.INTEGRATION_SLACK === '1',
    },
    sentry: sentry.SENTRY === '1' ? { dsn: sentry.SENTRY_DSN } : null,
    release: base.RELEASE ?? 'local',
    environment: base.ENVIRONMENT,
    nodeEnv: base.NODE_ENV,
    graphql: {
      persistedOperations: base.GRAPHQL_PERSISTED_OPERATIONS === '1',
    },
    zendeskSupport: base.ZENDESK_SUPPORT === '1',
    migrations: {
      member_roles_deadline: migrations.MEMBER_ROLES_DEADLINE ?? null,
    },
  } as const;
}

export const env = Object.keys(envValues).length > 0 ? buildConfig() : noop();

/**
 * Next.js is so kind and tries to pre-render our page without the environment information being available... :)
 * Non of our pages can actually be pre-rendered without first running the backend as it requires the runtime environment variables.
 * So we just return a noop. :)
 */
function noop(): any {
  return new Proxy(new String(''), {
    get(obj, prop) {
      if (prop === Symbol.toPrimitive) {
        return () => undefined;
      }
      if (prop in String.prototype) {
        return obj[prop as any];
      }
      return noop();
    },
  });
}
