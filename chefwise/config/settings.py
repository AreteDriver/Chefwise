"""Application settings using pydantic-settings."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_model_complex: str = "gpt-4o"

    # Database
    database_url: str = "sqlite:///./data/chefwise.db"

    # App Settings
    debug: bool = False
    log_level: str = "INFO"

    # Paths
    @property
    def project_root(self) -> Path:
        """Get the project root directory."""
        return Path(__file__).parent.parent.parent

    @property
    def data_dir(self) -> Path:
        """Get the data directory."""
        data_path = self.project_root / "data"
        data_path.mkdir(exist_ok=True)
        return data_path

    @property
    def db_path(self) -> Path:
        """Get the database file path."""
        return self.data_dir / "chefwise.db"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
