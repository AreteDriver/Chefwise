"""ChefWise - Main Streamlit Application."""

import streamlit as st

# Page configuration must be first Streamlit command
st.set_page_config(
    page_title="ChefWise",
    page_icon="🍳",
    layout="wide",
    initial_sidebar_state="expanded",
)

import sys
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from chefwise.database import init_db


def init_session_state():
    """Initialize session state variables."""
    if "initialized" not in st.session_state:
        # Initialize database
        init_db()
        st.session_state.initialized = True

    if "current_suggestions" not in st.session_state:
        st.session_state.current_suggestions = []

    if "current_meal_plan" not in st.session_state:
        st.session_state.current_meal_plan = None

    if "shopping_list" not in st.session_state:
        st.session_state.shopping_list = []


def main():
    """Main application entry point."""
    init_session_state()

    # Sidebar navigation
    st.sidebar.title("ChefWise")
    st.sidebar.markdown("---")

    # Navigation
    pages = {
        "Recipe Finder": "recipe_finder",
        "Meal Planner": "meal_planner",
        "Recipe Modifier": "recipe_modifier",
        "My Recipes": "my_recipes",
        "Settings": "settings",
    }

    selection = st.sidebar.radio(
        "Navigate to",
        list(pages.keys()),
        label_visibility="collapsed",
    )

    st.sidebar.markdown("---")
    st.sidebar.caption("AI-powered recipe assistant")

    # Load the selected page
    if selection == "Recipe Finder":
        from chefwise.app.pages import recipe_finder
        recipe_finder.render()
    elif selection == "Meal Planner":
        from chefwise.app.pages import meal_planner
        meal_planner.render()
    elif selection == "Recipe Modifier":
        from chefwise.app.pages import recipe_modifier
        recipe_modifier.render()
    elif selection == "My Recipes":
        from chefwise.app.pages import my_recipes
        my_recipes.render()
    elif selection == "Settings":
        from chefwise.app.pages import settings
        settings.render()


if __name__ == "__main__":
    main()
