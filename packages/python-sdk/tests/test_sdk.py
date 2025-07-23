
import os
import pytest
from dotenv import load_dotenv
from web3 import Web3
from src.ensemble import Ensemble
from src.types import EnsembleConfig, NetworkConfig, Proposal

load_dotenv()

def setup_env(user_type='user'):
    provider = Web3(Web3.HTTPProvider(os.getenv('RPC_URL')))
    pk = os.getenv('AGENT_PRIVATE_KEY') if user_type == 'agent' else os.getenv('PRIVATE_KEY')
    return {'provider': provider, 'private_key': pk}

def setup_sdk(user_type='user'):
    env = setup_env(user_type)
    config = EnsembleConfig(
        network=NetworkConfig(
            rpc_url=os.getenv('RPC_URL'),
            chain_id=int(os.getenv('CHAIN_ID')),
            name=os.getenv('NETWORK_NAME')
        ),
        agent_registry_address=os.getenv('AGENT_REGISTRY_ADDRESS'),
        task_registry_address=os.getenv('TASK_REGISTRY_ADDRESS')
    )
    sdk = Ensemble(config)
    return sdk, env['private_key']

class TestEnsembleSDK:
    @pytest.fixture(autouse=True)
    @pytest.mark.asyncio
    async def setup(self):
        self.sdk, self.private_key = setup_sdk()
        await self.sdk.connect(self.private_key)
        yield
        await self.sdk.stop()

    async def test_initialization(self):
        sdk, private_key = setup_sdk()
        await sdk.connect(private_key)
        assert isinstance(sdk, Ensemble)

    async def test_create_task(self):
        task_params = {
            "prompt": "Test task",
            "task_type": 0  # SIMPLE
        }
        task_id = await self.sdk.create_task(task_params)
        assert isinstance(task_id, int)

    async def test_get_tasks_by_owner(self):
        owner_address = await self.sdk.get_wallet_address()
        tasks = await self.sdk.get_tasks_by_owner(owner_address)
        assert isinstance(tasks, list)

    async def test_agent_registration(self):
        agent_data = {
            "model": "gpt-4",
            "prompt": "You are a crypto analyzer agent",
            "skills": ["analyzing stables", "analyzing memes"]
        }

        agent_address = await self.sdk.register_agent(
            agent_data["model"],
            agent_data["prompt"],
            agent_data["skills"]
        )
        assert Web3.is_address(agent_address)

        is_registered = await self.sdk.is_agent_registered(agent_address)
        assert is_registered is True

        agent_info = await self.sdk.get_agent_data(agent_address)
        assert agent_info["model"] == agent_data["model"]
        assert agent_info["prompt"] == agent_data["prompt"]
        assert len(agent_info["skills"]) == len(agent_data["skills"])

    async def test_proposal_management(self):
        agent_sdk, agent_pk = setup_sdk('agent')
        await agent_sdk.connect(agent_pk)

        # Create a task first
        task_params = {
            "prompt": "Test task for proposal",
            "task_type": 0
        }
        task_id = await self.sdk.create_task(task_params)

        # Register agent
        agent_data = {
            "model": "gpt-4",
            "prompt": "Test agent",
            "skills": ["test skill"]
        }
        agent_address = await agent_sdk.register_agent(
            agent_data["model"],
            agent_data["prompt"],
            agent_data["skills"]
        )

        # Send proposal
        price = 100
        await agent_sdk.send_proposal(str(task_id), agent_address, price)

        # Get proposals
        proposals = await self.sdk.get_proposals(str(task_id))
        assert len(proposals) > 0

        # Approve proposal
        proposal = Proposal(
            id='1',
            price=price,
            task_id=str(task_id),
            agent=agent_address
        )
        await self.sdk.approve_proposal(task_id, proposal)

        # Complete task
        result = "Task completed successfully"
        await agent_sdk.complete_task(task_id, result)

        task_data = await self.sdk.get_task_data(str(task_id))
        assert task_data["status"] == 2  # Completed status

        await agent_sdk.stop()
