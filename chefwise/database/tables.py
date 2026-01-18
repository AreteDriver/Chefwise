"""SQLAlchemy table definitions."""

import json
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Date,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


class RecipeTable(Base):
    """Saved recipes table."""

    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    ingredients_json = Column(Text, nullable=False)  # JSON string
    instructions_json = Column(Text, nullable=False)  # JSON string
    prep_time_minutes = Column(Integer, nullable=True)
    cook_time_minutes = Column(Integer, nullable=True)
    servings = Column(Integer, default=4)
    dietary_tags_json = Column(Text, default="[]")  # JSON string
    cuisine = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    meal_slots = relationship("MealSlotTable", back_populates="recipe")

    @property
    def ingredients(self) -> list:
        """Parse ingredients from JSON."""
        return json.loads(self.ingredients_json) if self.ingredients_json else []

    @ingredients.setter
    def ingredients(self, value: list) -> None:
        """Store ingredients as JSON."""
        self.ingredients_json = json.dumps(value)

    @property
    def instructions(self) -> list:
        """Parse instructions from JSON."""
        return json.loads(self.instructions_json) if self.instructions_json else []

    @instructions.setter
    def instructions(self, value: list) -> None:
        """Store instructions as JSON."""
        self.instructions_json = json.dumps(value)

    @property
    def dietary_tags(self) -> list:
        """Parse dietary tags from JSON."""
        return json.loads(self.dietary_tags_json) if self.dietary_tags_json else []

    @dietary_tags.setter
    def dietary_tags(self, value: list) -> None:
        """Store dietary tags as JSON."""
        self.dietary_tags_json = json.dumps(value)


class MealPlanTable(Base):
    """Meal plans table."""

    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    # Relationships
    meals = relationship("MealSlotTable", back_populates="meal_plan", cascade="all, delete-orphan")


class MealSlotTable(Base):
    """Individual meals in a meal plan."""

    __tablename__ = "meal_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=False)
    date = Column(Date, nullable=False)
    meal_type = Column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    recipe_title = Column(String(255), nullable=False)  # Store title even without saved recipe
    notes = Column(Text, nullable=True)

    # Relationships
    meal_plan = relationship("MealPlanTable", back_populates="meals")
    recipe = relationship("RecipeTable", back_populates="meal_slots")


class UserPreferencesTable(Base):
    """User preferences table (single row)."""

    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dietary_restrictions_json = Column(Text, default="[]")
    allergies_json = Column(Text, default="[]")
    disliked_ingredients_json = Column(Text, default="[]")
    favorite_cuisines_json = Column(Text, default="[]")
    skill_level = Column(String(50), default="intermediate")
    serving_size = Column(Integer, default=4)
    max_cook_time_minutes = Column(Integer, nullable=True)
    prefer_quick_meals = Column(Boolean, default=False)
    budget_conscious = Column(Boolean, default=False)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)

    @property
    def dietary_restrictions(self) -> list:
        return json.loads(self.dietary_restrictions_json) if self.dietary_restrictions_json else []

    @dietary_restrictions.setter
    def dietary_restrictions(self, value: list) -> None:
        self.dietary_restrictions_json = json.dumps(value)

    @property
    def allergies(self) -> list:
        return json.loads(self.allergies_json) if self.allergies_json else []

    @allergies.setter
    def allergies(self, value: list) -> None:
        self.allergies_json = json.dumps(value)

    @property
    def disliked_ingredients(self) -> list:
        return json.loads(self.disliked_ingredients_json) if self.disliked_ingredients_json else []

    @disliked_ingredients.setter
    def disliked_ingredients(self, value: list) -> None:
        self.disliked_ingredients_json = json.dumps(value)

    @property
    def favorite_cuisines(self) -> list:
        return json.loads(self.favorite_cuisines_json) if self.favorite_cuisines_json else []

    @favorite_cuisines.setter
    def favorite_cuisines(self, value: list) -> None:
        self.favorite_cuisines_json = json.dumps(value)
