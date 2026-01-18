"""User preferences Pydantic model."""

from typing import Optional

from pydantic import BaseModel, Field


class UserPreferences(BaseModel):
    """User preferences for recipe suggestions and meal planning."""

    dietary_restrictions: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    disliked_ingredients: list[str] = Field(default_factory=list)
    favorite_cuisines: list[str] = Field(default_factory=list)
    skill_level: str = "intermediate"  # beginner, intermediate, advanced
    serving_size: int = 4
    max_cook_time_minutes: Optional[int] = None
    prefer_quick_meals: bool = False
    budget_conscious: bool = False
