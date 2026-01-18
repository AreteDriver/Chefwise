"""Database repositories for CRUD operations."""

import json
from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from chefwise.models import (
    Recipe,
    RecipeCreate,
    MealPlan,
    MealPlanCreate,
    MealSlot,
    UserPreferences,
    Ingredient,
)
from .tables import RecipeTable, MealPlanTable, MealSlotTable, UserPreferencesTable


class RecipeRepository:
    """Repository for recipe CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, recipe: RecipeCreate) -> Recipe:
        """Create a new recipe."""
        db_recipe = RecipeTable(
            title=recipe.title,
            description=recipe.description,
            ingredients_json=json.dumps([ing.model_dump() for ing in recipe.ingredients]),
            instructions_json=json.dumps(recipe.instructions),
            prep_time_minutes=recipe.prep_time_minutes,
            cook_time_minutes=recipe.cook_time_minutes,
            servings=recipe.servings,
            dietary_tags_json=json.dumps([t.value if hasattr(t, 'value') else t for t in recipe.dietary_tags]),
            cuisine=recipe.cuisine,
            difficulty=recipe.difficulty,
        )
        self.db.add(db_recipe)
        self.db.commit()
        self.db.refresh(db_recipe)
        return self._to_model(db_recipe)

    def get(self, recipe_id: int) -> Optional[Recipe]:
        """Get a recipe by ID."""
        db_recipe = self.db.query(RecipeTable).filter(RecipeTable.id == recipe_id).first()
        return self._to_model(db_recipe) if db_recipe else None

    def get_all(self) -> list[Recipe]:
        """Get all recipes."""
        db_recipes = self.db.query(RecipeTable).order_by(RecipeTable.created_at.desc()).all()
        return [self._to_model(r) for r in db_recipes]

    def search(self, query: str) -> list[Recipe]:
        """Search recipes by title or description."""
        db_recipes = (
            self.db.query(RecipeTable)
            .filter(
                RecipeTable.title.ilike(f"%{query}%")
                | RecipeTable.description.ilike(f"%{query}%")
            )
            .all()
        )
        return [self._to_model(r) for r in db_recipes]

    def delete(self, recipe_id: int) -> bool:
        """Delete a recipe by ID."""
        db_recipe = self.db.query(RecipeTable).filter(RecipeTable.id == recipe_id).first()
        if db_recipe:
            self.db.delete(db_recipe)
            self.db.commit()
            return True
        return False

    def _to_model(self, db_recipe: RecipeTable) -> Recipe:
        """Convert database record to Pydantic model."""
        ingredients_data = json.loads(db_recipe.ingredients_json)
        ingredients = [Ingredient(**ing) for ing in ingredients_data]

        return Recipe(
            id=db_recipe.id,
            title=db_recipe.title,
            description=db_recipe.description,
            ingredients=ingredients,
            instructions=json.loads(db_recipe.instructions_json),
            prep_time_minutes=db_recipe.prep_time_minutes,
            cook_time_minutes=db_recipe.cook_time_minutes,
            servings=db_recipe.servings,
            dietary_tags=json.loads(db_recipe.dietary_tags_json),
            cuisine=db_recipe.cuisine,
            difficulty=db_recipe.difficulty,
            created_at=db_recipe.created_at,
            updated_at=db_recipe.updated_at,
        )


class MealPlanRepository:
    """Repository for meal plan CRUD operations."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, meal_plan: MealPlanCreate) -> MealPlan:
        """Create a new meal plan with meals."""
        db_plan = MealPlanTable(
            name=meal_plan.name,
            start_date=meal_plan.start_date,
            end_date=meal_plan.end_date,
            notes=meal_plan.notes,
        )
        self.db.add(db_plan)
        self.db.flush()  # Get the ID

        # Add meal slots
        for meal in meal_plan.meals:
            db_slot = MealSlotTable(
                meal_plan_id=db_plan.id,
                date=meal.date,
                meal_type=meal.meal_type.value if hasattr(meal.meal_type, 'value') else meal.meal_type,
                recipe_id=meal.recipe_id,
                recipe_title=meal.recipe_title,
                notes=meal.notes,
            )
            self.db.add(db_slot)

        self.db.commit()
        self.db.refresh(db_plan)
        return self._to_model(db_plan)

    def get(self, plan_id: int) -> Optional[MealPlan]:
        """Get a meal plan by ID."""
        db_plan = self.db.query(MealPlanTable).filter(MealPlanTable.id == plan_id).first()
        return self._to_model(db_plan) if db_plan else None

    def get_all(self) -> list[MealPlan]:
        """Get all meal plans."""
        db_plans = self.db.query(MealPlanTable).order_by(MealPlanTable.created_at.desc()).all()
        return [self._to_model(p) for p in db_plans]

    def get_current(self) -> Optional[MealPlan]:
        """Get the current active meal plan."""
        today = date.today()
        db_plan = (
            self.db.query(MealPlanTable)
            .filter(MealPlanTable.start_date <= today, MealPlanTable.end_date >= today)
            .first()
        )
        return self._to_model(db_plan) if db_plan else None

    def delete(self, plan_id: int) -> bool:
        """Delete a meal plan by ID."""
        db_plan = self.db.query(MealPlanTable).filter(MealPlanTable.id == plan_id).first()
        if db_plan:
            self.db.delete(db_plan)
            self.db.commit()
            return True
        return False

    def _to_model(self, db_plan: MealPlanTable) -> MealPlan:
        """Convert database record to Pydantic model."""
        meals = [
            MealSlot(
                id=slot.id,
                date=slot.date,
                meal_type=slot.meal_type,
                recipe_id=slot.recipe_id,
                recipe_title=slot.recipe_title,
                notes=slot.notes,
            )
            for slot in db_plan.meals
        ]

        return MealPlan(
            id=db_plan.id,
            name=db_plan.name,
            start_date=db_plan.start_date,
            end_date=db_plan.end_date,
            meals=meals,
            notes=db_plan.notes,
            created_at=db_plan.created_at,
            updated_at=db_plan.updated_at,
        )


class PreferencesRepository:
    """Repository for user preferences."""

    def __init__(self, db: Session):
        self.db = db

    def get(self) -> UserPreferences:
        """Get user preferences (creates default if none exists)."""
        db_prefs = self.db.query(UserPreferencesTable).first()
        if not db_prefs:
            db_prefs = UserPreferencesTable()
            self.db.add(db_prefs)
            self.db.commit()
            self.db.refresh(db_prefs)
        return self._to_model(db_prefs)

    def update(self, preferences: UserPreferences) -> UserPreferences:
        """Update user preferences."""
        db_prefs = self.db.query(UserPreferencesTable).first()
        if not db_prefs:
            db_prefs = UserPreferencesTable()
            self.db.add(db_prefs)

        db_prefs.dietary_restrictions_json = json.dumps(preferences.dietary_restrictions)
        db_prefs.allergies_json = json.dumps(preferences.allergies)
        db_prefs.disliked_ingredients_json = json.dumps(preferences.disliked_ingredients)
        db_prefs.favorite_cuisines_json = json.dumps(preferences.favorite_cuisines)
        db_prefs.skill_level = preferences.skill_level
        db_prefs.serving_size = preferences.serving_size
        db_prefs.max_cook_time_minutes = preferences.max_cook_time_minutes
        db_prefs.prefer_quick_meals = preferences.prefer_quick_meals
        db_prefs.budget_conscious = preferences.budget_conscious

        self.db.commit()
        self.db.refresh(db_prefs)
        return self._to_model(db_prefs)

    def _to_model(self, db_prefs: UserPreferencesTable) -> UserPreferences:
        """Convert database record to Pydantic model."""
        return UserPreferences(
            dietary_restrictions=json.loads(db_prefs.dietary_restrictions_json or "[]"),
            allergies=json.loads(db_prefs.allergies_json or "[]"),
            disliked_ingredients=json.loads(db_prefs.disliked_ingredients_json or "[]"),
            favorite_cuisines=json.loads(db_prefs.favorite_cuisines_json or "[]"),
            skill_level=db_prefs.skill_level,
            serving_size=db_prefs.serving_size,
            max_cook_time_minutes=db_prefs.max_cook_time_minutes,
            prefer_quick_meals=db_prefs.prefer_quick_meals,
            budget_conscious=db_prefs.budget_conscious,
        )
