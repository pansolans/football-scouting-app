from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Wyscout
    WYSCOUT_HOST: str = "https://apirest.wyscout.com"
    WYSCOUT_API_KEY: str = ""
    WYSCOUT_API_SECRET: str = ""

    # Security
    SECRET_KEY: str = "default-secret-key"
    JWT_SECRET_KEY: str = "default-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Application
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
