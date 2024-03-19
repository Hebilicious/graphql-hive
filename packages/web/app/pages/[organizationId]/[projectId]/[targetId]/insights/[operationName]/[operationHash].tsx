import { ReactElement, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw } from 'lucide-react';
import { useQuery } from 'urql';
import { authenticated } from '@/components/authenticated-container';
import { Section } from '@/components/common';
import { GraphQLHighlight } from '@/components/common/GraphQLSDLBlock';
import { Page, TargetLayout } from '@/components/layouts/target';
import { ClientsFilterTrigger } from '@/components/target/insights/Filters';
import { OperationsStats } from '@/components/target/insights/Stats';
import { Button } from '@/components/ui/button';
import { DateRangePicker, presetLast1Day } from '@/components/ui/date-range-picker';
import { Subtitle, Title } from '@/components/ui/page';
import { QueryError } from '@/components/ui/query-error';
import { EmptyList, MetaTitle } from '@/components/v2';
import { graphql } from '@/gql';
import { useRouteSelector } from '@/lib/hooks';
import { useDateRangeController } from '@/lib/hooks/use-date-range-controller';

const GraphQLOperationBody_GetOperationBodyQuery = graphql(`
  query GraphQLOperationBody_GetOperationBodyQuery($selector: OperationBodyByHashInput!) {
    operationBodyByHash(selector: $selector)
  }
`);

export function GraphQLOperationBody({
  hash,
  organization,
  project,
  target,
}: {
  hash: string;
  organization: string;
  project: string;
  target: string;
}) {
  const [result] = useQuery({
    query: GraphQLOperationBody_GetOperationBodyQuery,
    variables: { selector: { hash, organization, project, target } },
  });

  const { data, fetching, error } = result;

  if (fetching) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Oh no... {error.message}</div>;
  }

  if (data?.operationBodyByHash) {
    return <GraphQLHighlight className="pt-6" code={data.operationBodyByHash} />;
  }

  return null;
}

function OperationView({
  organizationCleanId,
  projectCleanId,
  targetCleanId,
  dataRetentionInDays,
  operationHash,
  operationName,
}: {
  organizationCleanId: string;
  projectCleanId: string;
  targetCleanId: string;
  dataRetentionInDays: number;
  operationHash: string;
  operationName: string;
}): ReactElement {
  const dateRangeController = useDateRangeController({
    dataRetentionInDays,
    defaultPreset: presetLast1Day,
  });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const operationsList = useMemo(() => [operationHash], [operationHash]);

  return (
    <>
      <div className="flex flex-row items-center justify-between py-6">
        <div>
          <Title>{operationName}</Title>
          <Subtitle>Insights of individual GraphQL operation</Subtitle>
        </div>
        <div className="flex justify-end gap-x-2">
          <ClientsFilterTrigger
            period={dateRangeController.resolvedRange}
            selected={selectedClients}
            onFilter={setSelectedClients}
          />
          <DateRangePicker
            validUnits={['y', 'M', 'w', 'd', 'h']}
            selectedRange={dateRangeController.selectedPreset.range}
            startDate={dateRangeController.startDate}
            align="end"
            onUpdate={args => dateRangeController.setSelectedPreset(args.preset)}
          />
          <Button variant="outline" onClick={() => dateRangeController.refreshResolvedRange()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>
      <OperationsStats
        organization={organizationCleanId}
        project={projectCleanId}
        target={targetCleanId}
        period={dateRangeController.resolvedRange}
        dateRangeText={dateRangeController.selectedPreset.label}
        operationsFilter={operationsList}
        clientNamesFilter={selectedClients}
        mode="operation-page"
        resolution={dateRangeController.resolution}
      />
      <div className="mt-12 w-full rounded-md border border-gray-800 bg-gray-900/50 p-5">
        <Section.Title>Operation body</Section.Title>
        <GraphQLOperationBody
          organization={organizationCleanId}
          project={projectCleanId}
          target={targetCleanId}
          hash={operationHash}
        />
      </div>
    </>
  );
}

const OperationInsightsPageQuery = graphql(`
  query OperationInsightsPageQuery($organizationId: ID!, $projectId: ID!, $targetId: ID!) {
    organizations {
      ...TargetLayout_OrganizationConnectionFragment
    }
    organization(selector: { organization: $organizationId }) {
      organization {
        ...TargetLayout_CurrentOrganizationFragment
        cleanId
        rateLimit {
          retentionInDays
        }
      }
    }
    project(selector: { organization: $organizationId, project: $projectId }) {
      ...TargetLayout_CurrentProjectFragment
      cleanId
    }
    target(selector: { organization: $organizationId, project: $projectId, target: $targetId }) {
      id
      cleanId
    }
    hasCollectedOperations(
      selector: { organization: $organizationId, project: $projectId, target: $targetId }
    )
    me {
      ...TargetLayout_MeFragment
    }
    ...TargetLayout_IsCDNEnabledFragment
  }
`);

function OperationInsightsContent({
  operationHash,
  operationName,
}: {
  operationHash: string;
  operationName: string;
}) {
  const router = useRouteSelector();
  const [query] = useQuery({
    query: OperationInsightsPageQuery,
    variables: {
      organizationId: router.organizationId,
      projectId: router.projectId,
      targetId: router.targetId,
    },
  });

  if (query.error) {
    return <QueryError error={query.error} />;
  }

  const me = query.data?.me;
  const currentOrganization = query.data?.organization?.organization;
  const currentProject = query.data?.project;
  const currentTarget = query.data?.target;
  const organizationConnection = query.data?.organizations;
  const isCDNEnabled = query.data;
  const hasCollectedOperations = query.data?.hasCollectedOperations === true;

  return (
    <TargetLayout
      page={Page.Insights}
      currentOrganization={currentOrganization ?? null}
      currentProject={currentProject ?? null}
      me={me ?? null}
      organizations={organizationConnection ?? null}
      isCDNEnabled={isCDNEnabled ?? null}
    >
      {currentOrganization && currentProject && currentTarget ? (
        hasCollectedOperations ? (
          <OperationView
            organizationCleanId={currentOrganization.cleanId}
            projectCleanId={currentProject.cleanId}
            targetCleanId={currentTarget.cleanId}
            dataRetentionInDays={currentOrganization.rateLimit.retentionInDays}
            operationHash={operationHash}
            operationName={operationName}
          />
        ) : (
          <div className="py-8">
            <EmptyList
              title="Hive is waiting for your first collected operation"
              description="You can collect usage of your GraphQL API with Hive Client"
              docsUrl="/features/usage-reporting"
            />
          </div>
        )
      ) : null}
    </TargetLayout>
  );
}

function OperationInsightsPage(): ReactElement {
  const router = useRouter();
  const { operationHash, operationName } = router.query;

  if (!operationHash || typeof operationHash !== 'string') {
    throw new Error('Invalid operation hash');
  }

  if (!operationName || typeof operationName !== 'string') {
    throw new Error('Invalid operation name');
  }

  return (
    <>
      <MetaTitle title={`Operation ${operationName}`} />
      <OperationInsightsContent operationHash={operationHash} operationName={operationName} />
    </>
  );
}

export default authenticated(OperationInsightsPage);
