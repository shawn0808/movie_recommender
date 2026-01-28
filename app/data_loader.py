import pandas as pd
import numpy as np
import logging
import os
from collections import defaultdict

logger = logging.getLogger(__name__)


def _build_structures_from_dfs(combined_df, movies_df):
    """Build in-memory structures from combined and movies DataFrames."""
    user_ratings = defaultdict(dict)
    movie_ratings = defaultdict(dict)
    
    for _, row in combined_df.iterrows():
        user_id = int(row['userId'])
        movie_id = int(row['movieId'])
        rating = float(row['rating'])
        user_ratings[user_id][movie_id] = rating
        movie_ratings[movie_id][user_id] = rating
    
    movie_metadata = {}
    for _, row in movies_df.iterrows():
        movie_id = int(row['movieId'])
        movie_metadata[movie_id] = {
            'title': str(row.get('title', f'Movie {movie_id}')),
            'genres': str(row.get('genres', ''))
        }
    
    for movie_id in set(combined_df['movieId'].dropna().astype(int)):
        if movie_id not in movie_metadata:
            movie_metadata[movie_id] = {'title': f'Movie {movie_id}', 'genres': ''}
    
    user_ids = set(user_ratings.keys())
    movie_ids = set(movie_ratings.keys()) | set(movie_metadata.keys())
    
    return {
        'user_ratings': dict(user_ratings),
        'movie_ratings': dict(movie_ratings),
        'movie_metadata': movie_metadata,
        'user_ids': user_ids,
        'movie_ids': movie_ids,
        'combined_df': combined_df,
    }


def load_data(config):
    """
    Load data from Parquet cache if present (fast), else from CSV and create cache.
    
    Returns a dictionary containing:
    - user_ratings: dict[userId, dict[movieId, rating]]
    - movie_ratings: dict[movieId, dict[userId, rating]]
    - movie_metadata: dict[movieId, {title, genres}]
    - user_ids: set of all user IDs
    - movie_ids: set of all movie IDs
    """
    cache_ratings = config.get('CACHE_RATINGS_PARQUET')
    cache_movies = config.get('CACHE_MOVIES_PARQUET')
    ratings_csv = config.get('RATINGS_CSV')
    movies_csv = config.get('MOVIES_CSV')
    
    # Prefer Parquet cache if both files exist
    if cache_ratings and cache_movies and os.path.exists(cache_ratings) and os.path.exists(cache_movies):
        logger.info("Loading from Parquet cache...")
        try:
            combined_df = pd.read_parquet(cache_ratings)
            movies_df = pd.read_parquet(cache_movies)
            data = _build_structures_from_dfs(combined_df, movies_df)
            logger.info(
                f"Loaded {len(data['user_ids'])} users, {len(data['movie_ids'])} movies, "
                f"{len(combined_df)} ratings (from cache)"
            )
            return data
        except Exception as e:
            logger.warning(f"Parquet cache read failed: {e}. Falling back to CSV.")
    
    # Load from CSV
    if not os.path.exists(ratings_csv):
        raise FileNotFoundError(f"Ratings file not found: {ratings_csv}")
    if not os.path.exists(movies_csv):
        raise FileNotFoundError(f"Movies file not found: {movies_csv}")
    
    logger.info(f"Loading ratings from {ratings_csv}")
    ratings_df = pd.read_csv(ratings_csv)
    logger.info(f"Loading movies from {movies_csv}")
    movies_df = pd.read_csv(movies_csv)
    
    for col in ['userId', 'movieId', 'rating']:
        if col not in ratings_df.columns:
            raise ValueError(f"Missing required column '{col}' in ratings.csv")
    if 'movieId' not in movies_df.columns:
        raise ValueError("Missing required column 'movieId' in movies.csv")
    
    ratings_df = ratings_df.dropna(subset=['userId', 'movieId', 'rating'])
    ratings_df['movieId'] = pd.to_numeric(ratings_df['movieId'], errors='coerce').astype('Int64')
    ratings_df['userId'] = pd.to_numeric(ratings_df['userId'], errors='coerce').astype('Int64')
    movies_df['movieId'] = pd.to_numeric(movies_df['movieId'], errors='coerce').astype('Int64')
    
    ratings_df = ratings_df[ratings_df['movieId'].notna() & ratings_df['userId'].notna()]
    movies_df = movies_df[movies_df['movieId'].notna()]
    
    logger.info("Combining ratings and movies datasets")
    combined_df = ratings_df.merge(movies_df, on='movieId', how='left')
    
    data = _build_structures_from_dfs(combined_df, movies_df)
    logger.info(
        f"Loaded {len(data['user_ids'])} users, {len(data['movie_ids'])} movies, "
        f"{len(combined_df)} ratings"
    )
    
    # Save Parquet cache for next time
    if cache_ratings and cache_movies:
        try:
            combined_df.to_parquet(cache_ratings, index=False)
            movies_df.to_parquet(cache_movies, index=False)
            logger.info("Parquet cache saved for faster startup next time.")
        except Exception as e:
            logger.warning(f"Could not save Parquet cache: {e}")
    
    return data

def get_data_bundle():
    """Helper function to get the current data bundle (for compatibility)."""
    # This will be set by the app initialization
    pass
