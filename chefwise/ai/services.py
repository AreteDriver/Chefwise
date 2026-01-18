"""AI-powered services for recipe suggestion, meal planning, and modification."""

from datetime import date, timedelta
from typing import Optional

from chefwise.models import (
    RecipeSuggestion,
    Ingredient,
    MealPlanCreate,
    MealSlot,
    MealType,
    UserPreferences,
    ShoppingListItem,
)
from .openai_client import OpenAIClient
from .prompts import (
    RECIPE_SUGGESTION_SYSTEM,
    RECIPE_SUGGESTION_USER,
    MEAL_PLAN_SYSTEM,
    MEAL_PLAN_USER,
    RECIPE_MODIFICATION_SYSTEM,
    RECIPE_MODIFICATION_USER,
    INGREDIENT_SUBSTITUTION_USER,
)


class RecipeSuggestionService:
    """Service for generating recipe suggestions from ingredients."""

    def __init__(self, client: Optional[OpenAIClient] = None):
        self.client = client or OpenAIClient()

    def suggest_recipes(
        self,
        ingredients: list[str],
        num_recipes: int = 3,
        dietary_restrictions: Optional[list[str]] = None,
        max_cook_time: Optional[int] = None,
        preferences: Optional[UserPreferences] = None,
    ) -> list[RecipeSuggestion]:
        """
        Generate recipe suggestions based on available ingredients.

        Args:
            ingredients: List of available ingredients
            num_recipes: Number of recipes to suggest (1-5)
            dietary_restrictions: List of dietary restrictions to consider
            max_cook_time: Maximum cooking time in minutes
            preferences: User preferences object

        Returns:
            List of RecipeSuggestion objects
        """
        # Build restriction text
        restrictions = dietary_restrictions or []
        if preferences:
            restrictions.extend(preferences.dietary_restrictions)
            restrictions.extend([f"allergic to {a}" for a in preferences.allergies])
            restrictions.extend([f"no {d}" for d in preferences.disliked_ingredients])

        restrictions_text = ""
        if restrictions:
            restrictions_text = f"Dietary restrictions/preferences: {', '.join(restrictions)}"

        # Build preferences text
        preferences_text = ""
        if max_cook_time:
            preferences_text += f"Maximum total cooking time: {max_cook_time} minutes\n"
        if preferences:
            if preferences.skill_level:
                preferences_text += f"Cooking skill level: {preferences.skill_level}\n"
            if preferences.prefer_quick_meals:
                preferences_text += "Prefer quick and easy meals\n"

        user_prompt = RECIPE_SUGGESTION_USER.format(
            num_recipes=num_recipes,
            ingredients=", ".join(ingredients),
            restrictions_text=restrictions_text,
            preferences_text=preferences_text,
        )

        response = self.client.chat_completion(
            system_prompt=RECIPE_SUGGESTION_SYSTEM,
            user_prompt=user_prompt,
        )

        # Parse response into RecipeSuggestion objects
        recipes = []
        for recipe_data in response.get("recipes", []):
            ingredients_list = [
                Ingredient(
                    name=ing.get("name", ""),
                    quantity=float(ing.get("quantity", 1)),
                    unit=ing.get("unit", ""),
                    notes=ing.get("notes"),
                )
                for ing in recipe_data.get("ingredients", [])
            ]

            recipe = RecipeSuggestion(
                title=recipe_data.get("title", "Untitled Recipe"),
                description=recipe_data.get("description", ""),
                ingredients=ingredients_list,
                instructions=recipe_data.get("instructions", []),
                prep_time_minutes=recipe_data.get("prep_time_minutes"),
                cook_time_minutes=recipe_data.get("cook_time_minutes"),
                servings=recipe_data.get("servings", 4),
                dietary_tags=recipe_data.get("dietary_tags", []),
                cuisine=recipe_data.get("cuisine"),
                difficulty=recipe_data.get("difficulty"),
                tips=recipe_data.get("tips"),
                why_this_recipe=recipe_data.get("why_this_recipe"),
            )
            recipes.append(recipe)

        return recipes


class MealPlanService:
    """Service for generating meal plans."""

    def __init__(self, client: Optional[OpenAIClient] = None):
        self.client = client or OpenAIClient()

    def generate_meal_plan(
        self,
        num_days: int = 7,
        start_date: Optional[date] = None,
        meal_types: Optional[list[MealType]] = None,
        preferences: Optional[UserPreferences] = None,
        favorite_cuisines: Optional[list[str]] = None,
    ) -> tuple[MealPlanCreate, list[ShoppingListItem]]:
        """
        Generate a meal plan for the specified number of days.

        Args:
            num_days: Number of days to plan (1-14)
            start_date: Start date for the plan (defaults to today)
            meal_types: Which meals to include
            preferences: User preferences
            favorite_cuisines: Preferred cuisines

        Returns:
            Tuple of (MealPlanCreate, shopping_list)
        """
        start_date = start_date or date.today()
        meal_types = meal_types or [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]

        # Build restrictions text
        restrictions_text = ""
        preferences_text = ""
        if preferences:
            restrictions = []
            restrictions.extend(preferences.dietary_restrictions)
            restrictions.extend([f"allergic to {a}" for a in preferences.allergies])
            restrictions.extend([f"no {d}" for d in preferences.disliked_ingredients])
            if restrictions:
                restrictions_text = f"Dietary restrictions: {', '.join(restrictions)}"

            if preferences.skill_level:
                preferences_text += f"Cooking skill level: {preferences.skill_level}\n"
            if preferences.max_cook_time_minutes:
                preferences_text += f"Weekday meals should be under {preferences.max_cook_time_minutes} minutes\n"
            if preferences.prefer_quick_meals:
                preferences_text += "Generally prefer quick meals\n"
            if preferences.serving_size:
                preferences_text += f"Default serving size: {preferences.serving_size}\n"

        # Build cuisine text
        cuisines = favorite_cuisines or (preferences.favorite_cuisines if preferences else [])
        cuisine_text = ""
        if cuisines:
            cuisine_text = f"Preferred cuisines: {', '.join(cuisines)}"

        user_prompt = MEAL_PLAN_USER.format(
            num_days=num_days,
            start_date=start_date.isoformat(),
            meal_types=", ".join(mt.value for mt in meal_types),
            restrictions_text=restrictions_text,
            preferences_text=preferences_text,
            cuisine_text=cuisine_text,
        )

        response = self.client.chat_completion(
            system_prompt=MEAL_PLAN_SYSTEM,
            user_prompt=user_prompt,
        )

        # Parse meals
        meals = []
        for meal_data in response.get("meals", []):
            meal = MealSlot(
                date=date.fromisoformat(meal_data.get("date", start_date.isoformat())),
                meal_type=meal_data.get("meal_type", "dinner"),
                recipe_title=meal_data.get("recipe_title", "Untitled"),
                notes=meal_data.get("notes"),
            )
            meals.append(meal)

        # Create meal plan
        end_date = start_date + timedelta(days=num_days - 1)
        meal_plan = MealPlanCreate(
            name=response.get("plan_name", f"Week of {start_date.isoformat()}"),
            start_date=start_date,
            end_date=end_date,
            meals=meals,
            notes=response.get("tips"),
        )

        # Parse shopping list
        shopping_list = [
            ShoppingListItem(
                name=item.get("name", ""),
                quantity=float(item.get("quantity", 1)),
                unit=item.get("unit", ""),
                category=item.get("category"),
            )
            for item in response.get("shopping_list", [])
        ]

        return meal_plan, shopping_list


class RecipeModificationService:
    """Service for modifying recipes (dietary, scaling, substitutions)."""

    def __init__(self, client: Optional[OpenAIClient] = None):
        self.client = client or OpenAIClient()

    def modify_recipe(
        self,
        title: str,
        ingredients: list[Ingredient],
        instructions: list[str],
        servings: int,
        modification_type: str,
        modification_details: str,
    ) -> RecipeSuggestion:
        """
        Modify a recipe based on specified requirements.

        Args:
            title: Original recipe title
            ingredients: Original ingredients
            instructions: Original instructions
            servings: Original serving size
            modification_type: Type of modification (dietary, scaling, substitution)
            modification_details: Specific modification details

        Returns:
            Modified recipe as RecipeSuggestion
        """
        ingredients_str = "\n".join(
            f"- {ing.quantity} {ing.unit} {ing.name}" + (f" ({ing.notes})" if ing.notes else "")
            for ing in ingredients
        )
        instructions_str = "\n".join(f"{i+1}. {step}" for i, step in enumerate(instructions))

        user_prompt = RECIPE_MODIFICATION_USER.format(
            title=title,
            ingredients=ingredients_str,
            instructions=instructions_str,
            servings=servings,
            modification_type=modification_type,
            modification_details=modification_details,
        )

        response = self.client.chat_completion(
            system_prompt=RECIPE_MODIFICATION_SYSTEM,
            user_prompt=user_prompt,
        )

        # Parse response
        ingredients_list = [
            Ingredient(
                name=ing.get("name", ""),
                quantity=float(ing.get("quantity", 1)),
                unit=ing.get("unit", ""),
                notes=ing.get("notes"),
            )
            for ing in response.get("ingredients", [])
        ]

        return RecipeSuggestion(
            title=response.get("title", f"Modified {title}"),
            description=response.get("description", ""),
            ingredients=ingredients_list,
            instructions=response.get("instructions", []),
            prep_time_minutes=response.get("prep_time_minutes"),
            cook_time_minutes=response.get("cook_time_minutes"),
            servings=response.get("servings", servings),
            dietary_tags=response.get("dietary_tags", []),
            tips=response.get("tips"),
            why_this_recipe=f"Modifications made: {', '.join(response.get('modifications_made', []))}",
        )

    def suggest_substitution(
        self,
        ingredient: str,
        recipe_context: str,
        reason: str = "preference",
    ) -> dict:
        """
        Suggest ingredient substitutions.

        Args:
            ingredient: Ingredient to substitute
            recipe_context: Brief description of the recipe
            reason: Why substitution is needed (allergy, preference, unavailable)

        Returns:
            Dictionary with substitution options
        """
        user_prompt = INGREDIENT_SUBSTITUTION_USER.format(
            ingredient=ingredient,
            recipe_context=recipe_context,
            reason=reason,
        )

        return self.client.chat_completion(
            system_prompt=RECIPE_MODIFICATION_SYSTEM,
            user_prompt=user_prompt,
        )

    def scale_recipe(
        self,
        title: str,
        ingredients: list[Ingredient],
        instructions: list[str],
        original_servings: int,
        new_servings: int,
    ) -> RecipeSuggestion:
        """
        Scale a recipe to a different serving size.

        Args:
            title: Recipe title
            ingredients: Original ingredients
            instructions: Original instructions
            original_servings: Current serving size
            new_servings: Desired serving size

        Returns:
            Scaled recipe
        """
        return self.modify_recipe(
            title=title,
            ingredients=ingredients,
            instructions=instructions,
            servings=original_servings,
            modification_type="scaling",
            modification_details=f"Scale from {original_servings} servings to {new_servings} servings. Adjust all ingredient quantities proportionally and modify instructions if needed for the new batch size.",
        )
