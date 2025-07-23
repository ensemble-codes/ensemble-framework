
from web3 import Web3
from eth_typing import Address
from .services.agent_service import AgentService
from .services.task_service import TaskService
from .services.proposal_service import ProposalService
from .services.contract_service import ContractService
from .types import EnsembleConfig, Proposal
from typing import Callable, Optional

class Ensemble:
    def __init__(self, config: EnsembleConfig):
        self.contract_service = ContractService(
            Web3(Web3.HTTPProvider(config.network.rpc_url)),
            None  # Account will be set in connect()
        )
        
        # Load contract ABIs
        with open('src/abi/AgentsRegistry.abi.json') as f:
            agents_registry_abi = f.read()
        with open('src/abi/TaskRegistry.abi.json') as f:
            task_registry_abi = f.read()
            
        self.agent_registry = self.contract_service.create_contract(
            config.agent_registry_address,
            agents_registry_abi
        )
        self.task_registry = self.contract_service.create_contract(
            config.task_registry_address,
            task_registry_abi
        )
        
        self.config = config
        
    async def connect(self, private_key: str):
        account = self.contract_service.provider.eth.account.from_key(private_key)
        self.contract_service.account = account
        
        # Initialize services
        self.agent_service = AgentService(self.agent_registry, account)
        self.task_service = TaskService(self.task_registry, account)
        self.proposal_service = ProposalService(
            project_id='ensemble-ai-443111',
            topic_name='ensemble-tasks',
            task_registry=self.task_registry
        )
        
        await self.contract_service.validate_network(self.config.network.chain_id)
        return self
        
    async def start(self):
        user_id = await self.agent_service.get_address()
        await self.proposal_service.setup_subscription(user_id)
        
    async def stop(self):
        if self.proposal_service.subscription:
            self.proposal_service.subscription.close()
            
    # Agent Management
    async def register_agent(self, model: str, prompt: str, skills: list[str]) -> str:
        return await self.agent_service.register_agent(model, prompt, skills)
        
    async def get_agent_data(self, agent_id: str):
        return await self.agent_service.get_agent_data(agent_id)
        
    async def is_agent_registered(self, agent_id: str) -> bool:
        return await self.agent_service.is_agent_registered(agent_id)
        
    # Task Management
    async def create_task(self, params: dict) -> int:
        return await self.task_service.create_task(params)
        
    async def get_task_data(self, task_id: str) -> dict:
        return await self.task_service.get_task_data(task_id)
        
    async def get_tasks_by_owner(self, owner: str) -> list:
        return await self.task_service.get_tasks_by_owner(owner)
        
    async def complete_task(self, task_id: int, result: str) -> None:
        await self.task_service.complete_task(task_id, result)
        
    # Proposal Management
    async def send_proposal(self, task_id: str, agent_id: str, price: int) -> None:
        await self.proposal_service.send_proposal(task_id, agent_id, price)
        
    async def get_proposals(self, task_id: str) -> list[str]:
        return await self.proposal_service.get_proposals(task_id)
        
    async def approve_proposal(self, task_id: int, proposal: Proposal) -> None:
        await self.proposal_service.approve_proposal(task_id, proposal)
        
    def set_on_new_proposal_listener(self, listener: Callable[[Proposal], None]):
        self.proposal_service.set_on_new_proposal_listener(listener)
        
    async def get_wallet_address(self) -> str:
        return await self.agent_service.get_address()
