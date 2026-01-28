import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

def parse_genres(genres_str):
    """Parse genres string into a set of genres."""
    if not genres_str or genres_str == '' or str(genres_str).lower() == 'nan':
        return set()
    
    if '|' in str(genres_str):
        genres = [g.strip() for g in str(genres_str).split('|')]
    elif ',' in str(genres_str):
        genres = [g.strip() for g in str(genres_str).split(',')]
    else:
        genres = [str(genres_str).strip()]
    
    return set(g for g in genres if g)

def build_user_genre_profile(custom_ratings, data_bundle):
    """Build a genre preference profile from custom ratings."""
    movie_metadata = data_bundle['movie_metadata']
    
    if not custom_ratings:
        return {}
    
    genre_scores = defaultdict(lambda: {'weighted_sum': 0.0, 'rating_sum': 0.0})
    
    for movie_id, rating in custom_ratings.items():
        movie_info = movie_metadata.get(movie_id, {})
        genres = parse_genres(movie_info.get('genres', ''))
        
        for genre in genres:
            genre_scores[genre]['weighted_sum'] += rating
            genre_scores[genre]['rating_sum'] += 1.0
    
    genre_profile = {}
    for genre, scores in genre_scores.items():
        if scores['rating_sum'] > 0:
            genre_profile[genre] = scores['weighted_sum'] / scores['rating_sum']
    
    return genre_profile

def get_movie_genre_vector(movie_id, all_genres, data_bundle):
    """Get binary vector representing which genres a movie has."""
    movie_metadata = data_bundle['movie_metadata']
    movie_info = movie_metadata.get(movie_id, {})
    movie_genres = parse_genres(movie_info.get('genres', ''))
    
    vector = np.zeros(len(all_genres))
    for i, genre in enumerate(all_genres):
        if genre in movie_genres:
            vector[i] = 1.0
    
    return vector

def get_user_genre_vector(user_profile, all_genres):
    """Get weighted vector representing user's genre preferences."""
    vector = np.zeros(len(all_genres))
    for i, genre in enumerate(all_genres):
        if genre in user_profile:
            vector[i] = user_profile[genre]
    
    return vector

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    return dot_product / (norm1 * norm2)

def get_recommendations_from_ratings(custom_ratings, data_bundle, n_recs=5):
    """Get recommendations using content-based filtering from custom ratings."""
    movie_metadata = data_bundle['movie_metadata']
    movie_ids = data_bundle['movie_ids']
    
    if not custom_ratings or len(custom_ratings) == 0:
        logger.warning("No custom ratings provided")
        return []
    
    user_profile = build_user_genre_profile(custom_ratings, data_bundle)
    
    if not user_profile:
        logger.warning("No genre information in rated movies")
        return []
    
    all_genres = set()
    for movie_id in movie_ids:
        movie_info = movie_metadata.get(movie_id, {})
        genres = parse_genres(movie_info.get('genres', ''))
        all_genres.update(genres)
    
    all_genres = sorted(list(all_genres))
    
    if not all_genres:
        logger.warning("No genre information available")
        return []
    
    user_vector = get_user_genre_vector(user_profile, all_genres)
    target_mean = np.mean(list(custom_ratings.values()))
    
    recommendations = []
    for movie_id in movie_ids:
        if movie_id in custom_ratings:
            continue
        
        movie_vector = get_movie_genre_vector(movie_id, all_genres, data_bundle)
        genre_similarity = cosine_similarity(user_vector, movie_vector)
        
        if genre_similarity == 0:
            continue
        
        predicted_rating = target_mean + (genre_similarity * (5.0 - target_mean))
        predicted_rating = max(0.0, min(5.0, predicted_rating))
        
        movie_info = movie_metadata.get(movie_id, {
            'title': f'Movie {movie_id}',
            'genres': ''
        })
        
        recommendations.append({
            'movieId': int(movie_id),
            'title': movie_info['title'],
            'genres': movie_info['genres'],
            'predictedRating': round(float(predicted_rating), 2)
        })
    
    recommendations.sort(key=lambda x: x['predictedRating'], reverse=True)
    return recommendations[:n_recs]

def get_recommendations(target_user_id, data_bundle, k_neighbors=30, min_overlap=5, n_recs=5):
    """Get recommendations for existing user (for backward compatibility)."""
    user_ratings = data_bundle['user_ratings']
    target_ratings = user_ratings.get(target_user_id, {})
    
    if not target_ratings:
        return []
    
    return get_recommendations_from_ratings(target_ratings, data_bundle, n_recs)

def clear_cache():
    """Clear cache (kept for API compatibility)."""
    pass
