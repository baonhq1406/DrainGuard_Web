from alembic import context
from sqlalchemy import engine_from_config, pool
from app.config import settings
config=context.config;config.set_main_option('sqlalchemy.url',settings.database_url)
def run_migrations_offline():
    context.configure(url=settings.database_url, literal_binds=True); 
    with context.begin_transaction(): context.run_migrations()
def run_migrations_online():
    connectable=engine_from_config(config.get_section(config.config_ini_section),prefix='sqlalchemy.',poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection)
        with context.begin_transaction(): context.run_migrations()
if context.is_offline_mode():run_migrations_offline()
else:run_migrations_online()
