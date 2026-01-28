# Movie Recommendation System

A collaborative filtering movie recommendation web application built with Flask and user-user collaborative filtering algorithm.

## Features

- **User-User Collaborative Filtering**: Recommends movies based on similar users' preferences
- **Interactive Web Interface**: Clean, modern UI to browse users and get recommendations
- **Movie Metadata Integration**: Combines ratings with movie titles and genres
- **Real-time Recommendations**: Fast API endpoints for getting personalized recommendations

## Requirements

- Python 3.7+
- Flask 3.0.0
- pandas 2.1.4
- numpy 1.26.2
- scikit-learn 1.3.2

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Prepare your data files:**
   - Place `ratings.csv` in the project root directory
   - Place `movies.csv` in the project root directory

   Expected CSV formats:
   - `ratings.csv`: Should contain columns `userId`, `movieId`, `rating` (and optionally `timestamp`)
   - `movies.csv`: Should contain columns `movieId`, `title` (and optionally `genres`)

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the web interface:**
   Open your browser and navigate to `http://localhost:5000`

## Usage

1. Select a user from the dropdown menu
2. Optionally adjust the number of recommendations (default: 20)
3. Click "Get Recommendations" to see personalized movie suggestions
4. View the user's rating history in the left panel
5. Browse recommended movies with predicted ratings in the right panel

## API Endpoints

- `GET /api/users` - Get list of all user IDs
- `GET /api/movies/<movie_id>` - Get metadata for a specific movie
- `GET /api/recommendations?userId=<id>&limit=<n>` - Get movie recommendations for a user
- `GET /api/user-history?userId=<id>` - Get rating history for a user

## Configuration

Edit `app/config.py` to adjust:
- `K_NEIGHBORS`: Number of similar users to consider (default: 30)
- `MIN_OVERLAP`: Minimum common movies for similarity calculation (default: 5)
- `N_RECOMMENDATIONS`: Default number of recommendations (default: 20)

## Algorithm

The recommendation system uses **User-User Collaborative Filtering**:

1. **Similarity Calculation**: Computes Pearson correlation between users based on their movie ratings (mean-centered)
2. **Neighbor Selection**: Selects top K most similar users with sufficient overlap
3. **Rating Prediction**: Predicts ratings for unrated movies by aggregating similar users' ratings, weighted by similarity
4. **Recommendation Ranking**: Returns top N movies sorted by predicted rating

## Project Structure

```
.
├── app/
│   ├── __init__.py          # Flask app factory
│   ├── config.py            # Configuration settings
│   ├── data_loader.py        # CSV loading and data processing
│   ├── recommender.py        # Collaborative filtering algorithm
│   └── routes.py             # API endpoints
├── templates/
│   └── index.html           # Frontend UI
├── app.py                   # Application entry point
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## Notes

- The application loads all data into memory on startup for fast recommendations
- Similarity scores are cached to improve performance for repeated queries
- Movies in ratings.csv that don't exist in movies.csv will use fallback titles
