from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional, List



# User Activity Schema
class ActivitySchema(BaseModel):
    id: int
    date: date
    activity_count: int
    total_duration: int  # minutes
    score: int
    problem_solved: int

# Badge Schema
class BadgeSchema(BaseModel):
    name: str
    description: str
    icon: str
    badge_type: str
    threshold: int
    color: str

# User Badge Schema
class UserBadgeSchema(BaseModel):
    id: int
    badge: BadgeSchema
    date_earned: datetime
    progress: float

# User Problem Status Schema
class UserProblemStatusSchema(BaseModel):
    problem_id: int
    problem_title: str
    is_completed: bool
    score: int
    solved_at: Optional[datetime]
    time_taken: Optional[int]=0 # seconds
    memory_used: Optional[int]=0 # KB

# User Stats Schema
class UserStatsSchema(BaseModel):
    total_solved: int
    easy_solved: int
    medium_solved: int
    hard_solved: int
    total_score: int
    current_streak: int
    max_streak: int
    last_activity: Optional[datetime]

# Contribution Calendar Schema
class ContributionDaySchema(BaseModel):
    date: date
    count: int

class ContributionMonthSchema(BaseModel):
    month: str
    days: List[ContributionDaySchema]

class ContributionCalendarSchema(BaseModel):
    year: int
    total: int
    calendar: List[ContributionMonthSchema]


