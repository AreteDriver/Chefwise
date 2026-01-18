"""Recipe Finder page - Get AI recipe suggestions based on ingredients."""

import streamlit as st

from chefwise.ai import RecipeSuggestionService
from chefwise.database import get_db_context, RecipeRepository, PreferencesRepository
from chefwise.models import RecipeCreate, Ingredient, DietaryRestriction


def render():
    """Render the Recipe Finder page."""
    st.title("Recipe Finder")
    st.markdown("Enter your available ingredients and get AI-powered recipe suggestions!")

    # Load user preferences
    with get_db_context() as db:
        prefs_repo = PreferencesRepository(db)
        preferences = prefs_repo.get()

    # Input section
    col1, col2 = st.columns([2, 1])

    with col1:
        ingredients_input = st.text_area(
            "What ingredients do you have?",
            placeholder="Enter ingredients separated by commas...\nExample: chicken, rice, garlic, onion, olive oil",
            height=120,
        )

    with col2:
        num_recipes = st.slider("Number of recipes", 1, 5, 3)
        max_cook_time = st.number_input(
            "Max cook time (minutes)",
            min_value=0,
            max_value=180,
            value=preferences.max_cook_time_minutes or 0,
            help="0 = no limit",
        )
        if max_cook_time == 0:
            max_cook_time = None

    # Dietary restrictions filter
    st.subheader("Dietary Filters")
    diet_cols = st.columns(4)
    dietary_restrictions = []

    restrictions_list = [
        ("Vegetarian", DietaryRestriction.VEGETARIAN.value),
        ("Vegan", DietaryRestriction.VEGAN.value),
        ("Gluten-Free", DietaryRestriction.GLUTEN_FREE.value),
        ("Dairy-Free", DietaryRestriction.DAIRY_FREE.value),
        ("Nut-Free", DietaryRestriction.NUT_FREE.value),
        ("Low-Carb", DietaryRestriction.LOW_CARB.value),
        ("Keto", DietaryRestriction.KETO.value),
        ("Paleo", DietaryRestriction.PALEO.value),
    ]

    for i, (label, value) in enumerate(restrictions_list):
        with diet_cols[i % 4]:
            if st.checkbox(label, key=f"diet_{value}"):
                dietary_restrictions.append(value)

    # Generate button
    st.markdown("---")

    if st.button("Find Recipes", type="primary", use_container_width=True):
        if not ingredients_input.strip():
            st.warning("Please enter at least one ingredient.")
            return

        # Parse ingredients
        ingredients = [ing.strip() for ing in ingredients_input.split(",") if ing.strip()]

        if len(ingredients) < 1:
            st.warning("Please enter at least one ingredient.")
            return

        with st.spinner("Finding delicious recipes for you..."):
            try:
                service = RecipeSuggestionService()
                suggestions = service.suggest_recipes(
                    ingredients=ingredients,
                    num_recipes=num_recipes,
                    dietary_restrictions=dietary_restrictions,
                    max_cook_time=max_cook_time,
                    preferences=preferences,
                )
                st.session_state.current_suggestions = suggestions
            except ValueError as e:
                st.error(f"Configuration error: {e}")
                st.info("Make sure you've set your OPENAI_API_KEY in the .env file.")
                return
            except Exception as e:
                st.error(f"Error generating recipes: {e}")
                return

    # Display suggestions
    if st.session_state.current_suggestions:
        st.markdown("---")
        st.subheader("Recipe Suggestions")

        for i, recipe in enumerate(st.session_state.current_suggestions):
            with st.expander(f"**{recipe.title}**", expanded=(i == 0)):
                # Recipe header
                col1, col2, col3 = st.columns(3)
                with col1:
                    if recipe.prep_time_minutes:
                        st.metric("Prep Time", f"{recipe.prep_time_minutes} min")
                with col2:
                    if recipe.cook_time_minutes:
                        st.metric("Cook Time", f"{recipe.cook_time_minutes} min")
                with col3:
                    st.metric("Servings", recipe.servings)

                # Description
                st.markdown(f"*{recipe.description}*")

                if recipe.why_this_recipe:
                    st.info(f"**Why this recipe:** {recipe.why_this_recipe}")

                # Tags
                if recipe.dietary_tags or recipe.cuisine or recipe.difficulty:
                    tags = []
                    if recipe.cuisine:
                        tags.append(f"🌍 {recipe.cuisine}")
                    if recipe.difficulty:
                        tags.append(f"📊 {recipe.difficulty}")
                    tags.extend([f"🏷️ {tag}" for tag in recipe.dietary_tags])
                    st.markdown(" | ".join(tags))

                # Ingredients
                st.markdown("### Ingredients")
                for ing in recipe.ingredients:
                    notes = f" ({ing.notes})" if ing.notes else ""
                    st.markdown(f"- {ing.quantity} {ing.unit} {ing.name}{notes}")

                # Instructions
                st.markdown("### Instructions")
                for j, step in enumerate(recipe.instructions, 1):
                    st.markdown(f"{j}. {step}")

                # Tips
                if recipe.tips:
                    st.markdown("### Tips")
                    st.info(recipe.tips)

                # Save button
                st.markdown("---")
                if st.button(f"Save Recipe", key=f"save_{i}", type="secondary"):
                    save_recipe(recipe)


def save_recipe(recipe):
    """Save a recipe suggestion to the database."""
    try:
        # Convert dietary tags to DietaryRestriction enum values where possible
        dietary_tags = []
        for tag in recipe.dietary_tags:
            tag_lower = tag.lower().replace("-", "_").replace(" ", "_")
            try:
                dietary_tags.append(DietaryRestriction(tag_lower))
            except ValueError:
                # Keep as string if not a valid enum
                pass

        recipe_create = RecipeCreate(
            title=recipe.title,
            description=recipe.description,
            ingredients=recipe.ingredients,
            instructions=recipe.instructions,
            prep_time_minutes=recipe.prep_time_minutes,
            cook_time_minutes=recipe.cook_time_minutes,
            servings=recipe.servings,
            dietary_tags=dietary_tags,
            cuisine=recipe.cuisine,
            difficulty=recipe.difficulty,
        )

        with get_db_context() as db:
            repo = RecipeRepository(db)
            saved_recipe = repo.create(recipe_create)

        st.success(f"Recipe '{saved_recipe.title}' saved successfully!")

    except Exception as e:
        st.error(f"Error saving recipe: {e}")
