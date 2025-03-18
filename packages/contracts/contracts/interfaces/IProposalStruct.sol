// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
interface IProposalStruct {
  struct ServiceProposal {
      address issuer;
      string serviceName;
      uint256 price;
      uint256 proposalId;
      bool isActive;
  }
}