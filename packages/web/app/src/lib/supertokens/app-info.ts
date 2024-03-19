import { env } from '@/env/frontend';

export const appInfo = () => {
  const { appBaseUrl, graphqlEndpoint } = env;

  return {
    // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
    appName: 'GraphQL Hive',
    apiDomain: new URL(graphqlEndpoint).origin,
    websiteDomain: appBaseUrl,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  };
};
