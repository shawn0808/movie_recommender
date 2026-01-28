from flask import render_template, jsonify, request
from app.recommender import get_recommendations
import logging

logger = logging.getLogger(__name__)

def init_app(app):
    """Initialize routes for the Flask app."""
    
    # Load data on startup (will be called from app.py)
    pass
    
    @app.route('/')
    def index():
        """Serve the main frontend page."""
        return render_template('index.html')
    
    @app.route('/api/users', methods=['GET'])
    def get_users():
        """Get list of all user IDs."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500
        
        users = sorted(data_bundle['user_ids'])
        return jsonify({'users': users})
    
    @app.route('/api/movies/<int:movie_id>', methods=['GET'])
    def get_movie(movie_id):
        """Get metadata for a specific movie."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500
        
        movie_info = data_bundle['movie_metadata'].get(movie_id)
        if not movie_info:
            return jsonify({'error': 'Movie not found'}), 404
        
        return jsonify({
            'movieId': movie_id,
            'title': movie_info.get('title', f'Movie {movie_id}'),
            'genres': movie_info.get('genres', '')
        })
    
    @app.route('/api/recommendations', methods=['GET'])
    def get_recommendations_endpoint():
        """Get movie recommendations for a user."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded. Please ensure ratings.csv and movies.csv exist.'}), 500
        
        user_id = request.args.get('userId', type=int)
        limit = request.args.get('limit', default=app.config.get('N_RECOMMENDATIONS', 20), type=int)
        
        if user_id is None:
            return jsonify({'error': 'userId parameter required'}), 400
        
        if limit < 1 or limit > 5:
            return jsonify({'error': 'limit must be between 1 and 5'}), 400
        
        if user_id not in data_bundle['user_ids']:
            return jsonify({'error': f'User {user_id} not found'}), 404
        
        try:
            recommendations = get_recommendations(
                user_id,
                data_bundle,
                k_neighbors=app.config.get('K_NEIGHBORS', 30),
                min_overlap=app.config.get('MIN_OVERLAP', 5),
                n_recs=limit
            )
            
            if not recommendations:
                return jsonify({
                    'recommendations': [],
                    'message': 'No recommendations available. User may not have enough rating history or similar users.'
                })
            
            return jsonify({'recommendations': recommendations})
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/user-history', methods=['GET'])
    def get_user_history():
        """Get rating history for a user."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500
        
        user_id = request.args.get('userId', type=int)
        if user_id is None:
            return jsonify({'error': 'userId parameter required'}), 400
        
        if user_id not in data_bundle['user_ratings']:
            return jsonify({'error': f'User {user_id} not found'}), 404
        
        user_ratings = data_bundle['user_ratings'][user_id]
        history = []
        
        for movie_id, rating in user_ratings.items():
            movie_info = data_bundle['movie_metadata'].get(movie_id, {})
            history.append({
                'movieId': movie_id,
                'title': movie_info.get('title', f'Movie {movie_id}'),
                'genres': movie_info.get('genres', ''),
                'rating': rating
            })
        
        # Sort by rating (highest first)
        history.sort(key=lambda x: x['rating'], reverse=True)
        
        return jsonify({'history': history})
    
    @app.route('/api/custom-recommendations', methods=['POST'])
    def get_custom_recommendations():
        """Get recommendations based on custom movie ratings."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500
        
        try:
            data = request.get_json()
            if not data or 'ratings' not in data:
                return jsonify({'error': 'ratings array required'}), 400
            
            ratings = data['ratings']
            if not isinstance(ratings, list) or len(ratings) == 0:
                return jsonify({'error': 'ratings must be a non-empty array'}), 400
            
            if len(ratings) > 5:
                return jsonify({'error': 'Maximum 5 ratings allowed'}), 400
            
            custom_ratings = {}
            for item in ratings:
                if 'movieId' not in item or 'rating' not in item:
                    return jsonify({'error': 'Each rating must have movieId and rating'}), 400
                
                movie_id = int(item['movieId'])
                rating = float(item['rating'])
                
                if rating < 0 or rating > 5:
                    return jsonify({'error': 'Rating must be between 0 and 5'}), 400
                
                if movie_id not in data_bundle['movie_ids']:
                    return jsonify({'error': f'Movie {movie_id} not found'}), 404
                
                custom_ratings[movie_id] = rating
            
            from app.recommender import get_recommendations_from_ratings
            recommendations = get_recommendations_from_ratings(
                custom_ratings,
                data_bundle,
                n_recs=5
            )
            
            return jsonify({'recommendations': recommendations})
            
        except Exception as e:
            logger.error(f"Error generating custom recommendations: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/search-movies', methods=['GET'])
    def search_movies():
        """Search for movies by title."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500
        
        query = request.args.get('q', '').strip().lower()
        if not query:
            return jsonify({'movies': []})
        
        try:
            limit = min(int(request.args.get('limit', 20)), 50)
        except (TypeError, ValueError):
            limit = 20
        
        results = []
        metadata = data_bundle.get('movie_metadata') or {}
        for movie_id, movie_info in metadata.items():
            try:
                title = str(movie_info.get('title', '')).lower()
                if query in title:
                    results.append({
                        'movieId': int(movie_id),
                        'title': movie_info.get('title', f'Movie {movie_id}'),
                        'genres': movie_info.get('genres', '')
                    })
                    if len(results) >= limit:
                        break
            except (TypeError, ValueError):
                continue
        
        return jsonify({'movies': results})

    @app.route('/api/top-movies', methods=['GET'])
    def top_movies():
        """Return globally top-rated movies by average rating."""
        data_bundle = app.config.get('data_bundle')
        if not data_bundle:
            return jsonify({'error': 'Data not loaded'}), 500

        movie_ratings = data_bundle.get('movie_ratings') or {}
        movie_metadata = data_bundle.get('movie_metadata') or {}

        try:
            limit = min(int(request.args.get('limit', 10)), 50)
        except (TypeError, ValueError):
            limit = 10

        min_count = 10  # minimum ratings per movie to be considered

        stats = []
        for movie_id, ratings_by_user in movie_ratings.items():
            if not ratings_by_user:
                continue
            count = len(ratings_by_user)
            if count < min_count:
                continue
            avg = sum(ratings_by_user.values()) / count
            info = movie_metadata.get(movie_id, {})
            stats.append({
                'movieId': int(movie_id),
                'title': info.get('title', f'Movie {movie_id}'),
                'genres': info.get('genres', ''),
                'avgRating': round(float(avg), 2),
                'ratingCount': count,
            })

        stats.sort(key=lambda m: (m['avgRating'], m['ratingCount']), reverse=True)
        return jsonify({'movies': stats[:limit]})
