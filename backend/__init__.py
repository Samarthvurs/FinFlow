# This file makes the backend directory a Python package 

# Initialize the backend package with environment variables

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

print("Backend initialized, environment variables loaded.") 