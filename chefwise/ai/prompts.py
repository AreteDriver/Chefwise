"""Prompt templates for AI interactions."""

RECIPE_SUGGESTION_SYSTEM = """You are ChefWise, an expert culinary AI assistant.
You help users discover delicious recipes based on ingredients they have available.

When suggesting recipes:
- Focus on practical, achievable recipes with the given ingredients
- Consider the user's dietary restrictions and preferences
- Provide clear, step-by-step instructions
- Include helpful tips and variations when appropriate

Always respond in valid JSON format."""

RECIPE_SUGGESTION_USER = """Based on these available ingredients, suggest {num_recipes} recipe(s) I can make.

Available ingredients:
{ingredients}

{restrictions_text}
{preferences_text}

Please respond with a JSON object in this exact format:
{{
    "recipes": [
        {{
            "title": "Recipe Name",
            "description": "Brief description of the dish",
            "ingredients": [
                {{"name": "ingredient", "quantity": 1.0, "unit": "cup", "notes": "optional notes"}}
            ],
            "instructions": ["Step 1", "Step 2", "Step 3"],
            "prep_time_minutes": 15,
            "cook_time_minutes": 30,
            "servings": 4,
            "dietary_tags": ["vegetarian", "gluten_free"],
            "cuisine": "Italian",
            "difficulty": "easy",
            "tips": "Optional cooking tips",
            "why_this_recipe": "Why this recipe works with the given ingredients"
        }}
    ]
}}"""

MEAL_PLAN_SYSTEM = """You are ChefWise, an expert meal planning AI assistant.
You create balanced, varied weekly meal plans tailored to user preferences.

When creating meal plans:
- Ensure nutritional variety across the week
- Balance different cuisines and cooking methods
- Consider prep time and complexity for weekday vs weekend meals
- Minimize food waste by reusing ingredients across meals
- Account for dietary restrictions and preferences

Always respond in valid JSON format."""

MEAL_PLAN_USER = """Create a {num_days}-day meal plan starting from {start_date}.

Include these meal types: {meal_types}

{restrictions_text}
{preferences_text}
{cuisine_text}

Please respond with a JSON object in this exact format:
{{
    "plan_name": "Week of {start_date}",
    "meals": [
        {{
            "date": "YYYY-MM-DD",
            "meal_type": "breakfast|lunch|dinner|snack",
            "recipe_title": "Recipe Name",
            "description": "Brief description",
            "prep_time_minutes": 15,
            "cook_time_minutes": 30,
            "notes": "Optional notes"
        }}
    ],
    "shopping_list": [
        {{"name": "ingredient", "quantity": 1.0, "unit": "cup", "category": "produce|dairy|meat|pantry|frozen|other"}}
    ],
    "tips": "General tips for the week"
}}"""

RECIPE_MODIFICATION_SYSTEM = """You are ChefWise, an expert culinary AI assistant.
You help users modify recipes to fit their dietary needs, scale servings, or substitute ingredients.

When modifying recipes:
- Maintain the essence and flavor profile of the original dish
- Ensure substitutions are appropriate and accessible
- Adjust cooking times and temperatures if needed
- Provide clear explanations for modifications

Always respond in valid JSON format."""

RECIPE_MODIFICATION_USER = """Please modify this recipe according to my requirements.

Original Recipe:
Title: {title}
Ingredients: {ingredients}
Instructions: {instructions}
Servings: {servings}

Modification requested: {modification_type}
Details: {modification_details}

Please respond with a JSON object in this exact format:
{{
    "title": "Modified Recipe Name",
    "description": "Description including what was changed",
    "ingredients": [
        {{"name": "ingredient", "quantity": 1.0, "unit": "cup", "notes": "optional notes"}}
    ],
    "instructions": ["Step 1", "Step 2", "Step 3"],
    "prep_time_minutes": 15,
    "cook_time_minutes": 30,
    "servings": 4,
    "dietary_tags": ["vegetarian"],
    "modifications_made": ["List of changes made"],
    "tips": "Tips for the modified version"
}}"""

INGREDIENT_SUBSTITUTION_USER = """I need a substitution for {ingredient} in this recipe context:
{recipe_context}

Reason for substitution: {reason}

Please suggest the best substitution(s) and explain how to use them.

Respond with a JSON object:
{{
    "original_ingredient": "{ingredient}",
    "substitutions": [
        {{
            "name": "substitute ingredient",
            "quantity": "adjusted quantity",
            "unit": "unit",
            "notes": "how to use it",
            "flavor_impact": "how it affects the dish"
        }}
    ],
    "recommendation": "which substitution is best and why"
}}"""
