import { BigInt } from "@graphprotocol/graph-ts";
import {
  AgentRegistered,
  ProposalAdded,
  ReputationUpdated
} from "../generated/AgentsRegistry/AgentsRegistry"
import {
  Agent,
  IpfsMetadata,
  Proposal
} from "../generated/schema"
import { getContentPath } from "./utils";
import { IpfsContent } from "../generated/templates"

export function handleAgentRegistered(event: AgentRegistered): void {
  let entity = new Agent(
    event.params.agent.toHex()
  )

  entity.name = event.params.name;
  entity.owner = event.params.owner;
  entity.agentUri = event.params.agentUri;
  entity.reputation = BigInt.fromString('0');
  entity.isRegistered = true;

  let contentPath = getContentPath(event.params.agentUri);

  if (contentPath != "") {
    entity.metadata = contentPath;
    IpfsContent.create(contentPath);
  }

  entity.save();
}

export function handleUpdateReputation(event: ReputationUpdated): void {
  let entity = Agent.load(event.params.agent.toHex());
  if (entity == null) {
    return
  }

  entity.reputation = event.params.newReputation;

  entity.save();
}

export function handleProposalAdded(event: ProposalAdded): void {
  let entity = new Proposal(event.params.proposalId.toString());

  entity.issuer = event.params.agent.toHex();
  entity.price = event.params.price;
  entity.service = event.params.name;

  entity.save()
}

