"""My Recipes page - View and manage saved recipes."""

import streamlit as st

from chefwise.database import get_db_context, RecipeRepository


def render():
    """Render the My Recipes page."""
    st.title("My Recipes")
    st.markdown("View and manage your saved recipe collection.")

    # Load recipes
    with get_db_context() as db:
        repo = RecipeRepository(db)
        recipes = repo.get_all()

    if not recipes:
        st.info("No saved recipes yet!")
        st.markdown("Go to **Recipe Finder** to discover and save delicious recipes.")
        return

    # Search and filter
    col1, col2 = st.columns([2, 1])

    with col1:
        search_query = st.text_input(
            "Search recipes",
            placeholder="Search by title or description...",
            key="recipe_search",
        )

    with col2:
        sort_option = st.selectbox(
            "Sort by",
            ["Newest first", "Oldest first", "A-Z", "Z-A"],
            key="recipe_sort",
        )

    # Filter recipes
    filtered_recipes = recipes
    if search_query:
        query_lower = search_query.lower()
        filtered_recipes = [
            r for r in recipes
            if query_lower in r.title.lower()
            or (r.description and query_lower in r.description.lower())
        ]

    # Sort recipes
    if sort_option == "Newest first":
        filtered_recipes.sort(key=lambda r: r.created_at, reverse=True)
    elif sort_option == "Oldest first":
        filtered_recipes.sort(key=lambda r: r.created_at)
    elif sort_option == "A-Z":
        filtered_recipes.sort(key=lambda r: r.title.lower())
    elif sort_option == "Z-A":
        filtered_recipes.sort(key=lambda r: r.title.lower(), reverse=True)

    # Display count
    st.markdown(f"**{len(filtered_recipes)}** recipes found")
    st.markdown("---")

    # Display recipes in a grid
    for recipe in filtered_recipes:
        with st.expander(f"**{recipe.title}**"):
            # Recipe header
            col1, col2, col3, col4 = st.columns(4)

            with col1:
                if recipe.prep_time_minutes:
                    st.metric("Prep", f"{recipe.prep_time_minutes}m")
                else:
                    st.metric("Prep", "-")

            with col2:
                if recipe.cook_time_minutes:
                    st.metric("Cook", f"{recipe.cook_time_minutes}m")
                else:
                    st.metric("Cook", "-")

            with col3:
                st.metric("Servings", recipe.servings)

            with col4:
                if recipe.difficulty:
                    st.metric("Difficulty", recipe.difficulty.capitalize())
                else:
                    st.metric("Difficulty", "-")

            # Description
            if recipe.description:
                st.markdown(f"*{recipe.description}*")

            # Tags
            tags = []
            if recipe.cuisine:
                tags.append(f"🌍 {recipe.cuisine}")
            if recipe.dietary_tags:
                for tag in recipe.dietary_tags:
                    tag_display = tag.value if hasattr(tag, 'value') else tag
                    tag_display = tag_display.replace("_", " ").title()
                    tags.append(f"🏷️ {tag_display}")

            if tags:
                st.markdown(" | ".join(tags))

            # Ingredients
            st.markdown("### Ingredients")
            cols = st.columns(2)
            half = len(recipe.ingredients) // 2 + len(recipe.ingredients) % 2

            for i, ing in enumerate(recipe.ingredients):
                col = cols[0] if i < half else cols[1]
                with col:
                    notes = f" ({ing.notes})" if ing.notes else ""
                    st.markdown(f"- {ing.quantity} {ing.unit} {ing.name}{notes}")

            # Instructions
            st.markdown("### Instructions")
            for i, step in enumerate(recipe.instructions, 1):
                st.markdown(f"{i}. {step}")

            # Metadata
            st.markdown("---")
            st.caption(f"Saved on {recipe.created_at.strftime('%B %d, %Y at %I:%M %p')}")

            # Actions
            col1, col2 = st.columns(2)

            with col1:
                if st.button("Edit in Modifier", key=f"edit_{recipe.id}", use_container_width=True):
                    st.session_state.recipe_to_modify = recipe
                    st.info("Go to Recipe Modifier to edit this recipe.")

            with col2:
                if st.button("Delete", key=f"delete_{recipe.id}", type="secondary", use_container_width=True):
                    st.session_state[f"confirm_delete_{recipe.id}"] = True

            # Confirmation dialog
            if st.session_state.get(f"confirm_delete_{recipe.id}"):
                st.warning(f"Are you sure you want to delete '{recipe.title}'?")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("Yes, delete", key=f"confirm_yes_{recipe.id}", type="primary"):
                        delete_recipe(recipe.id, recipe.title)
                        st.session_state[f"confirm_delete_{recipe.id}"] = False
                        st.rerun()
                with col2:
                    if st.button("Cancel", key=f"confirm_no_{recipe.id}"):
                        st.session_state[f"confirm_delete_{recipe.id}"] = False
                        st.rerun()


def delete_recipe(recipe_id: int, title: str):
    """Delete a recipe from the database."""
    try:
        with get_db_context() as db:
            repo = RecipeRepository(db)
            repo.delete(recipe_id)
        st.success(f"Recipe '{title}' deleted.")
    except Exception as e:
        st.error(f"Error deleting recipe: {e}")
