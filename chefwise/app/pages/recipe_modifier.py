"""Recipe Modifier page - Adapt recipes for dietary needs, scale servings, substitute ingredients."""

import streamlit as st

from chefwise.ai import RecipeModificationService
from chefwise.database import get_db_context, RecipeRepository
from chefwise.models import Ingredient, RecipeCreate, DietaryRestriction


def render():
    """Render the Recipe Modifier page."""
    st.title("Recipe Modifier")
    st.markdown("Adapt recipes for dietary needs, scale servings, or find ingredient substitutions!")

    # Load saved recipes for selection
    with get_db_context() as db:
        repo = RecipeRepository(db)
        saved_recipes = repo.get_all()

    # Tabs for different modification types
    tab1, tab2, tab3 = st.tabs(["Modify Recipe", "Scale Servings", "Ingredient Substitution"])

    with tab1:
        render_modify_tab(saved_recipes)

    with tab2:
        render_scale_tab(saved_recipes)

    with tab3:
        render_substitution_tab()


def render_modify_tab(saved_recipes):
    """Render the recipe modification tab."""
    st.subheader("Adapt a Recipe")

    # Recipe selection or manual input
    input_method = st.radio(
        "Choose recipe source",
        ["Select from saved recipes", "Enter manually"],
        horizontal=True,
        key="modify_input_method",
    )

    if input_method == "Select from saved recipes":
        if not saved_recipes:
            st.info("No saved recipes yet. Go to Recipe Finder to discover and save recipes!")
            return

        recipe_options = {r.title: r for r in saved_recipes}
        selected_title = st.selectbox(
            "Select a recipe",
            options=list(recipe_options.keys()),
            key="modify_recipe_select",
        )
        selected_recipe = recipe_options[selected_title]

        title = selected_recipe.title
        ingredients = selected_recipe.ingredients
        instructions = selected_recipe.instructions
        servings = selected_recipe.servings

        # Show current recipe
        with st.expander("View current recipe", expanded=False):
            st.markdown(f"**{title}**")
            st.markdown("**Ingredients:**")
            for ing in ingredients:
                st.markdown(f"- {ing.quantity} {ing.unit} {ing.name}")
            st.markdown("**Instructions:**")
            for i, step in enumerate(instructions, 1):
                st.markdown(f"{i}. {step}")
    else:
        title = st.text_input("Recipe Title", key="modify_title")
        ingredients_text = st.text_area(
            "Ingredients (one per line, format: quantity unit name)",
            placeholder="1 cup flour\n2 eggs\n1/2 tsp salt",
            key="modify_ingredients",
        )
        instructions_text = st.text_area(
            "Instructions (one step per line)",
            placeholder="Mix dry ingredients\nAdd wet ingredients\nBake at 350F",
            key="modify_instructions",
        )
        servings = st.number_input("Current servings", min_value=1, value=4, key="modify_servings")

        # Parse manual input
        ingredients = parse_ingredients(ingredients_text)
        instructions = [step.strip() for step in instructions_text.split("\n") if step.strip()]

    st.markdown("---")

    # Modification type
    modification_type = st.selectbox(
        "What would you like to do?",
        [
            "Make it vegetarian",
            "Make it vegan",
            "Make it gluten-free",
            "Make it dairy-free",
            "Make it low-carb/keto",
            "Make it healthier",
            "Custom modification",
        ],
        key="modification_type",
    )

    modification_details = ""
    if modification_type == "Custom modification":
        modification_details = st.text_area(
            "Describe your modification",
            placeholder="E.g., Make it spicier, use Mediterranean flavors, make it kid-friendly...",
            key="custom_modification",
        )
    else:
        modification_details = modification_type

    # Modify button
    if st.button("Modify Recipe", type="primary", key="modify_btn"):
        if not title or not ingredients:
            st.warning("Please provide a recipe title and ingredients.")
            return

        with st.spinner("Modifying your recipe..."):
            try:
                service = RecipeModificationService()
                modified = service.modify_recipe(
                    title=title,
                    ingredients=ingredients,
                    instructions=instructions,
                    servings=servings,
                    modification_type=modification_type.lower().replace(" ", "_"),
                    modification_details=modification_details,
                )

                st.session_state.modified_recipe = modified
            except ValueError as e:
                st.error(f"Configuration error: {e}")
                st.info("Make sure you've set your OPENAI_API_KEY in the .env file.")
                return
            except Exception as e:
                st.error(f"Error modifying recipe: {e}")
                return

    # Display modified recipe
    if "modified_recipe" in st.session_state and st.session_state.modified_recipe:
        display_modified_recipe(st.session_state.modified_recipe, "modified")


def render_scale_tab(saved_recipes):
    """Render the scaling tab."""
    st.subheader("Scale a Recipe")

    if not saved_recipes:
        st.info("No saved recipes yet. Go to Recipe Finder to discover and save recipes!")
        return

    recipe_options = {r.title: r for r in saved_recipes}
    selected_title = st.selectbox(
        "Select a recipe to scale",
        options=list(recipe_options.keys()),
        key="scale_recipe_select",
    )
    selected_recipe = recipe_options[selected_title]

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Current Servings", selected_recipe.servings)
    with col2:
        new_servings = st.number_input(
            "New servings",
            min_value=1,
            max_value=50,
            value=selected_recipe.servings * 2,
            key="new_servings",
        )

    if st.button("Scale Recipe", type="primary", key="scale_btn"):
        with st.spinner("Scaling your recipe..."):
            try:
                service = RecipeModificationService()
                scaled = service.scale_recipe(
                    title=selected_recipe.title,
                    ingredients=selected_recipe.ingredients,
                    instructions=selected_recipe.instructions,
                    original_servings=selected_recipe.servings,
                    new_servings=new_servings,
                )

                st.session_state.scaled_recipe = scaled
            except ValueError as e:
                st.error(f"Configuration error: {e}")
                return
            except Exception as e:
                st.error(f"Error scaling recipe: {e}")
                return

    if "scaled_recipe" in st.session_state and st.session_state.scaled_recipe:
        display_modified_recipe(st.session_state.scaled_recipe, "scaled")


def render_substitution_tab():
    """Render the ingredient substitution tab."""
    st.subheader("Find Ingredient Substitutions")

    ingredient = st.text_input(
        "Ingredient to substitute",
        placeholder="e.g., butter, eggs, all-purpose flour",
        key="sub_ingredient",
    )

    recipe_context = st.text_area(
        "Recipe context (what are you making?)",
        placeholder="e.g., chocolate chip cookies, banana bread, pasta sauce",
        key="sub_context",
    )

    reason = st.selectbox(
        "Reason for substitution",
        ["preference", "allergy", "unavailable", "dietary restriction", "healthier option"],
        key="sub_reason",
    )

    if st.button("Find Substitutions", type="primary", key="sub_btn"):
        if not ingredient or not recipe_context:
            st.warning("Please provide both the ingredient and recipe context.")
            return

        with st.spinner("Finding substitutions..."):
            try:
                service = RecipeModificationService()
                result = service.suggest_substitution(
                    ingredient=ingredient,
                    recipe_context=recipe_context,
                    reason=reason,
                )

                st.session_state.substitution_result = result
            except ValueError as e:
                st.error(f"Configuration error: {e}")
                return
            except Exception as e:
                st.error(f"Error finding substitutions: {e}")
                return

    if "substitution_result" in st.session_state and st.session_state.substitution_result:
        result = st.session_state.substitution_result

        st.markdown("---")
        st.subheader(f"Substitutions for {result.get('original_ingredient', ingredient)}")

        for sub in result.get("substitutions", []):
            with st.container():
                st.markdown(f"### {sub.get('name', 'Unknown')}")
                st.markdown(f"**Amount:** {sub.get('quantity', '')} {sub.get('unit', '')}")
                if sub.get("notes"):
                    st.markdown(f"**How to use:** {sub.get('notes')}")
                if sub.get("flavor_impact"):
                    st.info(f"**Flavor impact:** {sub.get('flavor_impact')}")
                st.markdown("---")

        if result.get("recommendation"):
            st.success(f"**Recommendation:** {result.get('recommendation')}")


def display_modified_recipe(recipe, prefix):
    """Display a modified recipe with save option."""
    st.markdown("---")
    st.subheader(f"Modified Recipe: {recipe.title}")

    if recipe.description:
        st.markdown(f"*{recipe.description}*")

    if recipe.why_this_recipe:
        st.info(recipe.why_this_recipe)

    col1, col2, col3 = st.columns(3)
    with col1:
        if recipe.prep_time_minutes:
            st.metric("Prep Time", f"{recipe.prep_time_minutes} min")
    with col2:
        if recipe.cook_time_minutes:
            st.metric("Cook Time", f"{recipe.cook_time_minutes} min")
    with col3:
        st.metric("Servings", recipe.servings)

    st.markdown("### Ingredients")
    for ing in recipe.ingredients:
        notes = f" ({ing.notes})" if ing.notes else ""
        st.markdown(f"- {ing.quantity} {ing.unit} {ing.name}{notes}")

    st.markdown("### Instructions")
    for i, step in enumerate(recipe.instructions, 1):
        st.markdown(f"{i}. {step}")

    if recipe.tips:
        st.markdown("### Tips")
        st.info(recipe.tips)

    if st.button(f"Save Modified Recipe", key=f"save_{prefix}", type="secondary"):
        save_modified_recipe(recipe)


def save_modified_recipe(recipe):
    """Save a modified recipe to the database."""
    try:
        dietary_tags = []
        for tag in recipe.dietary_tags:
            tag_lower = tag.lower().replace("-", "_").replace(" ", "_")
            try:
                dietary_tags.append(DietaryRestriction(tag_lower))
            except ValueError:
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
            saved = repo.create(recipe_create)

        st.success(f"Recipe '{saved.title}' saved!")

    except Exception as e:
        st.error(f"Error saving recipe: {e}")


def parse_ingredients(text: str) -> list[Ingredient]:
    """Parse ingredient text into Ingredient objects."""
    ingredients = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue

        # Simple parsing: try to extract quantity, unit, name
        parts = line.split()
        if len(parts) >= 2:
            try:
                # Try to parse first part as quantity
                quantity = float(parts[0].replace("/", "."))
                unit = parts[1] if len(parts) > 2 else ""
                name = " ".join(parts[2:]) if len(parts) > 2 else parts[1]
            except ValueError:
                # If first part isn't a number, treat whole thing as name
                quantity = 1.0
                unit = ""
                name = line

            ingredients.append(Ingredient(
                name=name,
                quantity=quantity,
                unit=unit,
            ))
        else:
            ingredients.append(Ingredient(name=line, quantity=1.0, unit=""))

    return ingredients
