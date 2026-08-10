from pydantic import BaseModel


class HealthStatus(BaseModel):
    api: bool
    database: bool

    @property
    def is_healthy(self) -> bool:
        return self.api and self.database