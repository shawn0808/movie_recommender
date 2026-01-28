import os

# Paths to CSV files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RATINGS_CSV = os.path.join(BASE_DIR, 'ratings.csv')
MOVIES_CSV = os.path.join(BASE_DIR, 'movies.csv')

# Parquet cache (faster load after first run)
CACHE_RATINGS_PARQUET = os.path.join(BASE_DIR, 'cache_ratings.parquet')
CACHE_MOVIES_PARQUET = os.path.join(BASE_DIR, 'cache_movies.parquet')

# Collaborative filtering parameters
K_NEIGHBORS = 30  # Number of similar users to consider
MIN_OVERLAP = 5   # Minimum number of common movies for similarity calculation
N_RECOMMENDATIONS = 5  # Default number of recommendations to return

# Cache settings
ENABLE_SIMILARITY_CACHE = True
