"""Recipe-related Pydantic models."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DietaryRestriction(str, Enum):
    """Dietary restrictions."""

    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    NUT_FREE = "nut_free"
    LOW_CARB = "low_carb"
    KETO = "keto"
    PALEO = "paleo"


class Ingredient(BaseModel):
    """An ingredient with quantity and unit."""

    name: str
    quantity: float
    unit: str
    notes: Optional[str] = None


class RecipeCreate(BaseModel):
    """Model for creating a new recipe."""

    title: str
    description: Optional[str] = None
    ingredients: list[Ingredient]
    instructions: list[str]
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: int = 4
    dietary_tags: list[DietaryRestriction] = Field(default_factory=list)
    cuisine: Optional[str] = None
    difficulty: Optional[str] = None  # easy, medium, hard


class Recipe(RecipeCreate):
    """A complete recipe with ID and timestamps."""

    id: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    @property
    def total_time_minutes(self) -> Optional[int]:
        """Calculate total time from prep and cook times."""
        if self.prep_time_minutes is None and self.cook_time_minutes is None:
            return None
        return (self.prep_time_minutes or 0) + (self.cook_time_minutes or 0)


class RecipeSuggestion(BaseModel):
    """A recipe suggestion from AI (before saving)."""

    title: str
    description: str
    ingredients: list[Ingredient]
    instructions: list[str]
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    servings: int = 4
    dietary_tags: list[str] = Field(default_factory=list)
    cuisine: Optional[str] = None
    difficulty: Optional[str] = None
    tips: Optional[str] = None
    why_this_recipe: Optional[str] = None  # AI explanation of why it suggested this
