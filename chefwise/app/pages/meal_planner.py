"""Meal Planner page - Generate AI-powered weekly meal plans."""

from datetime import date, timedelta

import streamlit as st

from chefwise.ai import MealPlanService
from chefwise.database import get_db_context, MealPlanRepository, PreferencesRepository
from chefwise.models import MealType


def render():
    """Render the Meal Planner page."""
    st.title("Meal Planner")
    st.markdown("Generate personalized meal plans with AI assistance!")

    # Load user preferences
    with get_db_context() as db:
        prefs_repo = PreferencesRepository(db)
        preferences = prefs_repo.get()

    # Plan configuration
    col1, col2 = st.columns(2)

    with col1:
        start_date = st.date_input(
            "Start Date",
            value=date.today(),
            min_value=date.today(),
        )
        num_days = st.slider("Number of Days", 1, 14, 7)

    with col2:
        st.markdown("**Meals to Include**")
        include_breakfast = st.checkbox("Breakfast", value=True)
        include_lunch = st.checkbox("Lunch", value=True)
        include_dinner = st.checkbox("Dinner", value=True)
        include_snacks = st.checkbox("Snacks", value=False)

    # Cuisine preferences
    st.subheader("Cuisine Preferences")
    cuisine_options = [
        "American", "Italian", "Mexican", "Chinese", "Japanese",
        "Indian", "Thai", "Mediterranean", "French", "Korean",
    ]

    selected_cuisines = st.multiselect(
        "Preferred cuisines (optional)",
        options=cuisine_options,
        default=preferences.favorite_cuisines if preferences.favorite_cuisines else [],
    )

    # Build meal types list
    meal_types = []
    if include_breakfast:
        meal_types.append(MealType.BREAKFAST)
    if include_lunch:
        meal_types.append(MealType.LUNCH)
    if include_dinner:
        meal_types.append(MealType.DINNER)
    if include_snacks:
        meal_types.append(MealType.SNACK)

    # Generate button
    st.markdown("---")

    if st.button("Generate Meal Plan", type="primary", use_container_width=True):
        if not meal_types:
            st.warning("Please select at least one meal type.")
            return

        with st.spinner("Creating your personalized meal plan..."):
            try:
                service = MealPlanService()
                meal_plan, shopping_list = service.generate_meal_plan(
                    num_days=num_days,
                    start_date=start_date,
                    meal_types=meal_types,
                    preferences=preferences,
                    favorite_cuisines=selected_cuisines,
                )
                st.session_state.current_meal_plan = meal_plan
                st.session_state.shopping_list = shopping_list
            except ValueError as e:
                st.error(f"Configuration error: {e}")
                st.info("Make sure you've set your OPENAI_API_KEY in the .env file.")
                return
            except Exception as e:
                st.error(f"Error generating meal plan: {e}")
                return

    # Display meal plan
    if st.session_state.current_meal_plan:
        plan = st.session_state.current_meal_plan

        st.markdown("---")
        st.subheader(f"📅 {plan.name}")

        if plan.notes:
            st.info(f"**Weekly Tips:** {plan.notes}")

        # Group meals by date
        meals_by_date = {}
        for meal in plan.meals:
            date_key = meal.date
            if date_key not in meals_by_date:
                meals_by_date[date_key] = []
            meals_by_date[date_key].append(meal)

        # Display calendar view
        tabs = st.tabs([d.strftime("%a %m/%d") for d in sorted(meals_by_date.keys())])

        for tab, (meal_date, meals) in zip(tabs, sorted(meals_by_date.items())):
            with tab:
                st.markdown(f"### {meal_date.strftime('%A, %B %d')}")

                for meal in sorted(meals, key=lambda m: ["breakfast", "lunch", "dinner", "snack"].index(m.meal_type) if m.meal_type in ["breakfast", "lunch", "dinner", "snack"] else 4):
                    meal_emoji = {
                        "breakfast": "🌅",
                        "lunch": "☀️",
                        "dinner": "🌙",
                        "snack": "🍎",
                    }.get(meal.meal_type, "🍽️")

                    st.markdown(f"**{meal_emoji} {meal.meal_type.capitalize()}:** {meal.recipe_title}")
                    if meal.notes:
                        st.caption(meal.notes)

        # Shopping list
        st.markdown("---")
        st.subheader("🛒 Shopping List")

        if st.session_state.shopping_list:
            # Group by category
            by_category = {}
            for item in st.session_state.shopping_list:
                category = item.category or "Other"
                if category not in by_category:
                    by_category[category] = []
                by_category[category].append(item)

            cols = st.columns(min(len(by_category), 3))

            for i, (category, items) in enumerate(sorted(by_category.items())):
                with cols[i % 3]:
                    st.markdown(f"**{category.capitalize()}**")
                    for item in items:
                        st.checkbox(
                            f"{item.quantity} {item.unit} {item.name}",
                            key=f"shop_{category}_{item.name}",
                        )
        else:
            st.info("Shopping list will appear here after generating a meal plan.")

        # Save button
        st.markdown("---")
        col1, col2 = st.columns(2)

        with col1:
            if st.button("Save Meal Plan", type="secondary", use_container_width=True):
                save_meal_plan(plan)

        with col2:
            if st.button("Clear Plan", use_container_width=True):
                st.session_state.current_meal_plan = None
                st.session_state.shopping_list = []
                st.rerun()


def save_meal_plan(meal_plan):
    """Save the meal plan to the database."""
    try:
        with get_db_context() as db:
            repo = MealPlanRepository(db)
            saved_plan = repo.create(meal_plan)

        st.success(f"Meal plan '{saved_plan.name}' saved successfully!")

    except Exception as e:
        st.error(f"Error saving meal plan: {e}")
