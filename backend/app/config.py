from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ALLOWED_ALGORITHMS = {"HS256", "HS384", "HS512"}


class Settings(BaseSettings):
    """App configuration, loaded and validated from the environment / .env.

    Pydantic does the validation for us - a bad value (empty secret, zero token
    lifetime, an unsupported DB driver) fails fast at startup instead of blowing
    up on the first request.
    """

    secret_key: str = Field(default="dev-secret-do-not-use-in-prod", min_length=8)
    access_token_expire_minutes: int = Field(default=60, gt=0)
    algorithm: str = "HS256"

    database_url: str = "sqlite+aiosqlite:///./app.db"
    seed_demo_data: bool = True

    # how long the mock LLM call pretends to take. tunable so tests can set it
    # to 0 instead of waiting two real seconds.
    summary_delay_seconds: float = Field(default=2.0, ge=0)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("algorithm")
    @classmethod
    def validate_algorithm(cls, value: str) -> str:
        if value not in ALLOWED_ALGORITHMS:
            raise ValueError(
                f"algorithm must be one of {sorted(ALLOWED_ALGORITHMS)}"
            )
        return value

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not value.startswith(("sqlite", "postgresql")):
            raise ValueError("database_url must be a sqlite or postgresql URL")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
