import { GraphQLClient } from 'graphql-request';
import { gql } from 'graphql-request';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [P in K]: Maybe<T[P]> };

export type Agent = {
  id: string;
  name: string;
  agentUri: string;
  owner: string;
  reputation: string;
  metadata?: Maybe<IpfsMetadata>;
  tasks: Task[];
  proposals: Proposal[];
};

export type IpfsMetadata = {
  id: string;
  name: string;
  description: string;
  imageUri: string;
  twitter?: Maybe<string>;
  telegram?: Maybe<string>;
  dexscreener?: Maybe<string>;
  github?: Maybe<string>;
  website?: Maybe<string>;
};

export type Proposal = {
  id: string;
  issuer: Agent;
  service: string;
  price: string;
  isRemoved: boolean;
};

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export type Task = {
  id: string;
  taskId: number;
  prompt: string;
  issuer: string;
  status: string;
  assignee: Agent;
  proposalId: string;
  result?: Maybe<string>;
  rating: string;
};

/** All input for the search services query */
export type GetServicesQueryVariables = {
  searchTerm?: InputMaybe<string>;
  limit?: InputMaybe<number>;
};

export type GetProposalsQueryVariables = {
  searchTerm?: InputMaybe<string>;
};

/** All input for the search agents query */
export type GetAgentsQueryVariables = {
  searchTerm?: InputMaybe<string>;
  limit?: InputMaybe<number>;
};

/** All input for the get agent details query */
export type GetAgentQueryVariables = {
  id: string;
};

/** All input for the get service details query */
export type GetServiceQueryVariables = {
  id: string;
};

export type GetAgentsQuery = {
  agents: Array<{
    id: string;
    name: string;
    agentUri: string;
    reputation: string;
    metadata?: Maybe<{
      name: string;
      description: string;
      imageUri: string;
    }>;
    proposals: Array<{
      id: string;
      service: string;
      price: string;
    }>;
  }>;
};

export type GetAgentQuery = {
  agent?: Maybe<{
    id: string;
    name: string;
    agentUri: string;
    reputation: string;
    owner: string;
    metadata?: Maybe<{
      name: string;
      description: string;
      imageUri: string;
      twitter?: Maybe<string>;
      telegram?: Maybe<string>;
      github?: Maybe<string>;
      website?: Maybe<string>;
      dexscreener?: Maybe<string>;
    }>;
    proposals: Array<{
      id: string;
      service: string;
      price: string;
      isRemoved: boolean;
    }>;
    tasks: Array<{
      id: string;
      taskId: number;
      prompt: string;
      status: string;
      result?: Maybe<string>;
      rating: string;
    }>;
  }>;
};

export type GetServicesQuery = {
  services: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
};

export type GetServiceQuery = {
  service?: Maybe<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
};

export type GetProposalsQuery = {
  proposals: Array<{
    id: string;
    service: string;
    price: string;
    isRemoved: boolean;
    issuer: Maybe<{
      id: string;
      name: string;
      agentUri: string;
      reputation: string;
      metadata?: Maybe<{
        name: string;
        description: string;
      }>;
    }>;
  }>;
}

export const GetAgentsDocument = gql`
  query GetAgents($searchTerm: String) {
    agents(
      where: {
        metadata_: { description_contains_nocase: $searchTerm }
      }
    ) {
      id
      name
      agentUri
      reputation
      metadata {
        name
        description
      }
    }
  }
`;

export const GetAgentDocument = gql`
  query GetAgent($id: ID!) {
    agent(id: $id) {
      id
      name
      agentUri
      reputation
      owner
      metadata {
        name
        description
        imageUri
        twitter
        telegram
        github
        website
        dexscreener
      }
      proposals {
        id
        service
        price
        isRemoved
      }
      tasks {
        id
        taskId
        prompt
        status
        result
        rating
      }
    }
  }
`;

export const GetServicesDocument = gql`
  query GetServices($searchTerm: String, $limit: Int) {
    services(
      first: $limit,
      where: {
        name_contains_nocase: $searchTerm
      }
    ) {
      id
      name
      category
      description
    }
  }
`;

export const GetServiceDocument = gql`
  query GetService($id: ID!) {
    service(id: $id) {
      id
      name
      category
      description
    }
  }
`;

export const GetProposalsDocument = gql`
  query GetProposals($searchTerm: String) {
    proposals(
      where: {
        service_contains_nocase: $searchTerm
      }
    ) {
      service
      issuer{
        id
        name
        agentUri
        reputation
        metadata {
          name
          description
        }
      }
    }
  }
`;

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string
) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper
) {
  return {
    GetAgents(
      variables?: GetAgentsQueryVariables,
      requestHeaders?: Record<string, string>
    ): Promise<GetAgentsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAgentsQuery>(GetAgentsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetAgents',
        'query'
      );
    },
    GetAgent(
      variables: GetAgentQueryVariables,
      requestHeaders?: Record<string, string>
    ): Promise<GetAgentQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetAgentQuery>(GetAgentDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetAgent',
        'query'
      );
    },
    GetServices(
      variables?: GetServicesQueryVariables,
      requestHeaders?: Record<string, string>
    ): Promise<GetServicesQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetServicesQuery>(GetServicesDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetServices',
        'query'
      );
    },
    GetProposals(
      variables: GetProposalsQueryVariables,
      requestHeaders?: Record<string, string>
    ): Promise<GetProposalsQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetProposalsQuery>(GetProposalsDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetProposals',
        'query'
      )
    },
    GetService(
      variables: GetServiceQueryVariables,
      requestHeaders?: Record<string, string>
    ): Promise<GetServiceQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetServiceQuery>(GetServiceDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetService',
        'query'
      );
    },
  };
}