"""Tests for database functionality."""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from datetime import date

from chefwise.database import init_db, get_db_context, RecipeRepository, MealPlanRepository, PreferencesRepository
from chefwise.models import RecipeCreate, Ingredient, MealPlanCreate, MealSlot, UserPreferences


@pytest.fixture(autouse=True)
def setup_database():
    """Initialize database before tests."""
    init_db()


def test_recipe_create_and_retrieve():
    """Test creating and retrieving a recipe."""
    recipe = RecipeCreate(
        title="Test Pasta",
        description="A simple test pasta dish",
        ingredients=[
            Ingredient(name="pasta", quantity=1, unit="lb"),
            Ingredient(name="tomato sauce", quantity=2, unit="cups"),
        ],
        instructions=["Boil pasta", "Add sauce", "Serve"],
        prep_time_minutes=10,
        cook_time_minutes=20,
        servings=4,
    )

    with get_db_context() as db:
        repo = RecipeRepository(db)
        created = repo.create(recipe)

        assert created.id is not None
        assert created.title == "Test Pasta"
        assert len(created.ingredients) == 2

        # Retrieve
        retrieved = repo.get(created.id)
        assert retrieved is not None
        assert retrieved.title == created.title


def test_recipe_search():
    """Test searching recipes."""
    recipe = RecipeCreate(
        title="Searchable Chicken Curry",
        description="A delicious curry",
        ingredients=[Ingredient(name="chicken", quantity=1, unit="lb")],
        instructions=["Cook chicken", "Add spices"],
        servings=4,
    )

    with get_db_context() as db:
        repo = RecipeRepository(db)
        repo.create(recipe)

        results = repo.search("curry")
        assert len(results) >= 1
        assert any("Curry" in r.title for r in results)


def test_preferences():
    """Test user preferences."""
    prefs = UserPreferences(
        dietary_restrictions=["vegetarian"],
        allergies=["peanuts"],
        skill_level="intermediate",
        serving_size=4,
    )

    with get_db_context() as db:
        repo = PreferencesRepository(db)
        saved = repo.update(prefs)

        assert saved.dietary_restrictions == ["vegetarian"]
        assert saved.allergies == ["peanuts"]

        # Retrieve
        retrieved = repo.get()
        assert retrieved.dietary_restrictions == ["vegetarian"]


def test_meal_plan():
    """Test meal plan creation."""
    meal_plan = MealPlanCreate(
        name="Test Week",
        start_date=date.today(),
        end_date=date.today(),
        meals=[
            MealSlot(
                date=date.today(),
                meal_type="dinner",
                recipe_title="Test Dinner",
            )
        ],
    )

    with get_db_context() as db:
        repo = MealPlanRepository(db)
        created = repo.create(meal_plan)

        assert created.id is not None
        assert created.name == "Test Week"
        assert len(created.meals) == 1
