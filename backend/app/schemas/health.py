from pydantic import BaseModel

from app.application.contracts import HealthStatus


class HealthStatusOutput(BaseModel):
    api: bool
    database: bool

    @classmethod
    def from_status(cls, status: HealthStatus) -> "HealthStatusOutput":
        return cls(api=status.api, database=status.database)
