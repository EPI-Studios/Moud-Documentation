import logging

logger = logging.getLogger(__name__)

class AnalyticsDB:
    def __init__(self):
        self._initialized = False
        logger.info("AnalyticsDB initialized (view counting is disabled).")

    def init_db(self):
        if self._initialized:
            return
        logger.info("Database check skipped (view counting is disabled).")
        self._initialized = True

    def record_view(self, document_name, ip_hash=None, user_agent=None):
        return 0

    def get_view_count(self, document_name):
        return 0

    def get_popular_documents(self, limit=10):
        return []

analytics_db = AnalyticsDB()