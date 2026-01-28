from app import create_app
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = create_app()

if __name__ == '__main__':
    # Load data before running
    with app.app_context():
        from app.data_loader import load_data
        try:
            logger.info("Loading data...")
            data_bundle = load_data(app.config)
            app.config['data_bundle'] = data_bundle
            logger.info(f"Data loaded successfully: {len(data_bundle['user_ids'])} users, {len(data_bundle['movie_ids'])} movies")
        except FileNotFoundError as e:
            logger.error(f"CSV file not found: {e}")
            logger.error("Please ensure ratings.csv and movies.csv are in the project root directory")
            app.config['data_bundle'] = None
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            import traceback
            traceback.print_exc()
            app.config['data_bundle'] = None
    
    app.run(debug=True, host='0.0.0.0', port=5001, use_reloader=False)
