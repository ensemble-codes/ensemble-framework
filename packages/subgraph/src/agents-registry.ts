import { BigInt } from "@graphprotocol/graph-ts";
import {
  AgentRegistered,
  ProposalAdded,
  ReputationUpdated
} from "../generated/AgentsRegistry/AgentsRegistry"
import {
  Agent,
  Proposal
} from "../generated/schema"

export function handleAgentRegistered(event: AgentRegistered): void {
  let entity = new Agent(
    event.params.agent
  )

  entity.name = event.params.name;
  entity.owner = event.params.owner;
  entity.agentUri = event.params.agentUri;
  entity.reputation = BigInt.fromString('0');
  entity.isRegistered = true;

  entity.save();
}

export function handleUpdateReputation(event: ReputationUpdated): void {
  let entity = Agent.load(event.params.agent);
  if (entity == null) {
    return
  }

  entity.reputation = event.params.newReputation;

  entity.save();
}

export function handleProposalAdded(event: ProposalAdded): void {
  let entity = new Proposal(event.params.proposalId.toString());

  entity.issuer = event.params.agent;
  entity.price = event.params.price;
  entity.service = event.params.name;

  entity.save()
}

