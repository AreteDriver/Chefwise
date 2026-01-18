"""Settings page - Manage user preferences and app configuration."""

import streamlit as st

from chefwise.database import get_db_context, PreferencesRepository
from chefwise.models import UserPreferences
from chefwise.config import settings


def render():
    """Render the Settings page."""
    st.title("Settings")
    st.markdown("Configure your preferences for personalized recipe suggestions.")

    # Load current preferences
    with get_db_context() as db:
        repo = PreferencesRepository(db)
        current_prefs = repo.get()

    # Create tabs for different settings sections
    tab1, tab2, tab3 = st.tabs(["Dietary Preferences", "Cooking Preferences", "About"])

    with tab1:
        render_dietary_preferences(current_prefs)

    with tab2:
        render_cooking_preferences(current_prefs)

    with tab3:
        render_about()


def render_dietary_preferences(current_prefs: UserPreferences):
    """Render dietary preferences section."""
    st.subheader("Dietary Restrictions")
    st.markdown("Select any dietary restrictions to consider when suggesting recipes.")

    restriction_options = [
        "Vegetarian",
        "Vegan",
        "Gluten-Free",
        "Dairy-Free",
        "Nut-Free",
        "Low-Carb",
        "Keto",
        "Paleo",
        "Halal",
        "Kosher",
    ]

    dietary_restrictions = st.multiselect(
        "Dietary restrictions",
        options=restriction_options,
        default=current_prefs.dietary_restrictions,
        key="dietary_restrictions",
    )

    st.subheader("Allergies")
    st.markdown("List any food allergies (these will be strictly avoided).")

    allergies_text = st.text_area(
        "Allergies (one per line)",
        value="\n".join(current_prefs.allergies),
        placeholder="e.g.,\npeanuts\nshellfish\nsoy",
        height=100,
        key="allergies",
    )
    allergies = [a.strip() for a in allergies_text.split("\n") if a.strip()]

    st.subheader("Disliked Ingredients")
    st.markdown("List ingredients you'd prefer to avoid (when possible).")

    disliked_text = st.text_area(
        "Disliked ingredients (one per line)",
        value="\n".join(current_prefs.disliked_ingredients),
        placeholder="e.g.,\ncilantro\nolives\nmushrooms",
        height=100,
        key="disliked",
    )
    disliked = [d.strip() for d in disliked_text.split("\n") if d.strip()]

    st.subheader("Favorite Cuisines")

    cuisine_options = [
        "American", "Italian", "Mexican", "Chinese", "Japanese",
        "Indian", "Thai", "Mediterranean", "French", "Korean",
        "Vietnamese", "Greek", "Spanish", "Middle Eastern", "Caribbean",
    ]

    favorite_cuisines = st.multiselect(
        "Favorite cuisines",
        options=cuisine_options,
        default=current_prefs.favorite_cuisines,
        key="favorite_cuisines",
    )

    # Save dietary preferences
    if st.button("Save Dietary Preferences", type="primary", key="save_dietary"):
        updated_prefs = UserPreferences(
            dietary_restrictions=dietary_restrictions,
            allergies=allergies,
            disliked_ingredients=disliked,
            favorite_cuisines=favorite_cuisines,
            skill_level=current_prefs.skill_level,
            serving_size=current_prefs.serving_size,
            max_cook_time_minutes=current_prefs.max_cook_time_minutes,
            prefer_quick_meals=current_prefs.prefer_quick_meals,
            budget_conscious=current_prefs.budget_conscious,
        )
        save_preferences(updated_prefs)


def render_cooking_preferences(current_prefs: UserPreferences):
    """Render cooking preferences section."""
    st.subheader("Cooking Skill Level")

    skill_level = st.select_slider(
        "Your cooking skill level",
        options=["beginner", "intermediate", "advanced"],
        value=current_prefs.skill_level,
        key="skill_level",
    )

    st.subheader("Default Settings")

    col1, col2 = st.columns(2)

    with col1:
        serving_size = st.number_input(
            "Default serving size",
            min_value=1,
            max_value=20,
            value=current_prefs.serving_size,
            key="serving_size",
        )

    with col2:
        max_cook_time = st.number_input(
            "Max cook time (minutes, 0 = no limit)",
            min_value=0,
            max_value=300,
            value=current_prefs.max_cook_time_minutes or 0,
            key="max_cook_time",
        )
        if max_cook_time == 0:
            max_cook_time = None

    st.subheader("Preferences")

    prefer_quick = st.checkbox(
        "Prefer quick and easy meals",
        value=current_prefs.prefer_quick_meals,
        key="prefer_quick",
    )

    budget_conscious = st.checkbox(
        "Budget-conscious suggestions",
        value=current_prefs.budget_conscious,
        key="budget_conscious",
    )

    # Save cooking preferences
    if st.button("Save Cooking Preferences", type="primary", key="save_cooking"):
        updated_prefs = UserPreferences(
            dietary_restrictions=current_prefs.dietary_restrictions,
            allergies=current_prefs.allergies,
            disliked_ingredients=current_prefs.disliked_ingredients,
            favorite_cuisines=current_prefs.favorite_cuisines,
            skill_level=skill_level,
            serving_size=serving_size,
            max_cook_time_minutes=max_cook_time,
            prefer_quick_meals=prefer_quick,
            budget_conscious=budget_conscious,
        )
        save_preferences(updated_prefs)


def render_about():
    """Render about section."""
    st.subheader("About ChefWise")

    st.markdown("""
    **ChefWise** is an AI-powered recipe assistant that helps you:

    - **Discover recipes** based on ingredients you have
    - **Plan meals** for the week with automatic shopping lists
    - **Modify recipes** for dietary needs or serving sizes
    - **Find substitutions** for ingredients you're missing

    ### Tech Stack
    - **AI**: OpenAI GPT-4o-mini / GPT-4o
    - **Backend**: FastAPI + SQLAlchemy
    - **Frontend**: Streamlit
    - **Database**: SQLite

    ### Configuration Status
    """)

    # Check configuration
    if settings.openai_api_key:
        st.success("OpenAI API key is configured")
    else:
        st.error("OpenAI API key is not configured")
        st.markdown("""
        To configure:
        1. Create a `.env` file in the project root
        2. Add: `OPENAI_API_KEY=your-key-here`
        3. Restart the app
        """)

    st.markdown(f"""
    ---
    **Current Settings:**
    - Model: `{settings.openai_model}`
    - Complex Model: `{settings.openai_model_complex}`
    - Database: `{settings.database_url}`
    - Debug Mode: `{settings.debug}`
    """)


def save_preferences(preferences: UserPreferences):
    """Save preferences to database."""
    try:
        with get_db_context() as db:
            repo = PreferencesRepository(db)
            repo.update(preferences)
        st.success("Preferences saved successfully!")
    except Exception as e:
        st.error(f"Error saving preferences: {e}")
