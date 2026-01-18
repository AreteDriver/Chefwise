"""Meal planning Pydantic models."""

from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class MealType(str, Enum):
    """Type of meal."""

    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"


class MealSlot(BaseModel):
    """A single meal slot in a meal plan."""

    id: Optional[int] = None
    date: date
    meal_type: MealType
    recipe_id: Optional[int] = None
    recipe_title: str
    notes: Optional[str] = None


class MealPlanCreate(BaseModel):
    """Model for creating a new meal plan."""

    name: str
    start_date: date
    end_date: date
    meals: list[MealSlot] = Field(default_factory=list)
    notes: Optional[str] = None


class MealPlan(MealPlanCreate):
    """A complete meal plan with ID and timestamps."""

    id: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


class ShoppingListItem(BaseModel):
    """An item on a shopping list."""

    name: str
    quantity: float
    unit: str
    category: Optional[str] = None  # produce, dairy, meat, pantry, etc.
    checked: bool = False


class ShoppingList(BaseModel):
    """A shopping list generated from a meal plan."""

    meal_plan_id: Optional[int] = None
    items: list[ShoppingListItem] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)
