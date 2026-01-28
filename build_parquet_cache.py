#!/usr/bin/env python3
"""
Build Parquet cache from ratings.csv and movies.csv.
Run once to create cache_ratings.parquet and cache_movies.parquet.
After that, the web app will load from Parquet on startup (faster).
"""
import os
import sys

# Run from project root
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import RATINGS_CSV, MOVIES_CSV, CACHE_RATINGS_PARQUET, CACHE_MOVIES_PARQUET

def main():
    config = {
        'RATINGS_CSV': RATINGS_CSV,
        'MOVIES_CSV': MOVIES_CSV,
        'CACHE_RATINGS_PARQUET': CACHE_RATINGS_PARQUET,
        'CACHE_MOVIES_PARQUET': CACHE_MOVIES_PARQUET,
    }
    from app.data_loader import load_data
    print("Building Parquet cache from CSV...")
    load_data(config)
    print("Done. Next app startup will use the cache.")

if __name__ == '__main__':
    main()
