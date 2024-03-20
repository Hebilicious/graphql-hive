import { env } from '@/env/frontend';

export const appInfo = () => {
  const { appBaseUrl, graphqlPublicOrigin: graphqlServerOrigin } = env;

  return {
    // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
    appName: 'GraphQL Hive',
    apiDomain: graphqlServerOrigin,
    websiteDomain: appBaseUrl,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  };
};
