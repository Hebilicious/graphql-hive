import React, { ReactElement, useEffect } from 'react';
import { useQuery } from 'urql';
import { authenticated } from '@/components/authenticated-container';
import { Title } from '@/components/common';
import { QueryError } from '@/components/ui/query-error';
import { HiveLogo } from '@/components/v2/icon';
import { graphql } from '@/gql';
import { useRouteSelector } from '@/lib/hooks/use-route-selector';
import { useLastVisitedOrganizationWriter } from '@/lib/last-visited-org';

export const DefaultOrganizationQuery = graphql(`
  query myDefaultOrganization($previouslyVisitedOrganizationId: ID) {
    myDefaultOrganization(previouslyVisitedOrganizationId: $previouslyVisitedOrganizationId) {
      organization {
        id
        cleanId
      }
    }
  }
`);

function Home(): ReactElement {
  const [query] = useQuery({ query: DefaultOrganizationQuery });
  const router = useRouteSelector();
  const defaultOrganization = query.data?.myDefaultOrganization?.organization;

  useLastVisitedOrganizationWriter(defaultOrganization?.cleanId);
  useEffect(() => {
    if (defaultOrganization) {
      void router.visitOrganization({ organizationId: defaultOrganization.cleanId });
    }
  }, [router, defaultOrganization]);

  if (query.error) {
    return <QueryError error={query.error} />;
  }

  return (
    <>
      <Title title="Home" />
      <div className="flex h-full w-full flex-row items-center justify-center">
        <HiveLogo className="h-16 w-16 animate-pulse" />
      </div>
    </>
  );
}

export default authenticated(Home);
