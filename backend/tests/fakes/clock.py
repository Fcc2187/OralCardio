from dataclasses import dataclass
from datetime import date


@dataclass
class FakeBusinessClock:
    current_date: date

    def today(self) -> date:
        return self.current_date
