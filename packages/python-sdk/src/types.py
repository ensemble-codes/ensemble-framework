
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
from decimal import Decimal

@dataclass
class Proposal:
    id: int
    price: int
    task_id: int
    agent: str

    @classmethod
    def from_dict(cls, data: dict) -> 'Proposal':
        return cls(
            id=int(data['id']),
            price=int(data['price']),
            task_id=int(data['taskId']),
            agent=data['agent']
        )

class TaskType(Enum):
    SIMPLE = 0
    COMPLEX = 1
    COMPOSITE = 2

class TaskStatus(Enum):
    CREATED = 0
    ASSIGNED = 1
    COMPLETED = 2
    FAILED = 3

@dataclass
class Skill:
    name: str
    level: int

@dataclass
class TaskData:
    id: str
    prompt: str
    task_type: TaskType
    assignee: Optional[str]
    status: TaskStatus
    owner: str

@dataclass
class AgentData:
    address: str
    model: str
    prompt: str
    skills: List[Skill]
    reputation: Decimal
    is_registered: bool

@dataclass
class NetworkConfig:
    chain_id: int
    name: Optional[str]
    rpc_url: str

@dataclass
class EnsembleConfig:
    task_registry_address: str
    agent_registry_address: str
    network: NetworkConfig
