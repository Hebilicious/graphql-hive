import { env } from '@/env/frontend';

export const appInfo = () => {
  const { appBaseUrl, graphqlPublicDomain } = env;

  return {
    // learn more about this on https://supertokens.com/docs/thirdpartyemailpassword/appinfo
    appName: 'GraphQL Hive',
    apiDomain: graphqlPublicDomain,
    websiteDomain: appBaseUrl,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  };
};
