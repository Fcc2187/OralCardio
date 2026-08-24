from pydantic import BaseModel


class HealthStatusOutput(BaseModel):
    api: bool
    database: bool
