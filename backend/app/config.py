from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str

    # Wyscout (supports both WYSCOUT_API_KEY/SECRET and WYSCOUT_USERNAME/PASSWORD)
    WYSCOUT_HOST: str = "https://apirest.wyscout.com"
    WYSCOUT_API_KEY: str = ""
    WYSCOUT_API_SECRET: str = ""
    WYSCOUT_USERNAME: str = ""
    WYSCOUT_PASSWORD: str = ""

    @property
    def wyscout_user(self) -> str:
        return self.WYSCOUT_API_KEY or self.WYSCOUT_USERNAME

    @property
    def wyscout_pass(self) -> str:
        return self.WYSCOUT_API_SECRET or self.WYSCOUT_PASSWORD

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
