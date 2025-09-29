# ChefWise

**AI-powered meal planning and recipe generation** — A Python/Streamlit web app combining GPT-4 with SQLite for personalized recipe suggestions and meal planning.

---

## What It Is

ChefWise is an AI-powered recipe assistant that helps you:
- **Discover recipes** based on ingredients you have available
- **Plan meals** for the week with automatic shopping list generation
- **Modify recipes** for dietary needs, scale servings, or find substitutions
- **Track preferences** for dietary restrictions, allergies, and favorite cuisines

---

## Tech Stack

- **Frontend**: Streamlit (Python)
- **Backend**: FastAPI + SQLAlchemy
- **Database**: SQLite (easily migrates to PostgreSQL)
- **AI**: OpenAI GPT-4o-mini / GPT-4o

---

## Quick Start

### Prerequisites
- Python 3.12+
- OpenAI API key

### Install

```bash
git clone https://github.com/Aretedriver/chefwise.git
cd chefwise
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OpenAI API key to .env
```

### Run

```bash
streamlit run chefwise/app/main.py
# Open http://localhost:8501
```

---

## Project Structure

```
chefwise/
├── .env.example           # API key template
├── pyproject.toml         # Python project config
├── requirements.txt       # Dependencies
├── chefwise/
│   ├── config/settings.py      # Pydantic settings
│   ├── models/                 # Pydantic models (Recipe, MealPlan, etc.)
│   ├── database/               # SQLAlchemy tables + repositories
│   ├── ai/
│   │   ├── prompts.py          # GPT prompt templates
│   │   ├── openai_client.py    # OpenAI API wrapper
│   │   └── services.py         # AI services
│   ├── api/                    # FastAPI endpoints (optional)
│   └── app/
│       ├── main.py             # Streamlit entry point
│       └── pages/              # App pages
├── data/                       # SQLite database
└── tests/
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Recipe Finder** | Enter ingredients → get AI recipe suggestions |
| **Meal Planner** | Generate weekly plans with shopping lists |
| **Recipe Modifier** | Adapt for dietary needs, scale servings |
| **My Recipes** | Save and manage your recipe collection |
| **Settings** | Configure dietary restrictions and preferences |

---

## Configuration

Create a `.env` file with:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MODEL_COMPLEX=gpt-4o
DATABASE_URL=sqlite:///./data/chefwise.db
```

---

## License

MIT License
