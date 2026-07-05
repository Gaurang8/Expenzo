from rest_framework.throttling import UserRateThrottle

class AILimitPerMinute(UserRateThrottle):
    scope = 'ai'

class AILimitPerDay(UserRateThrottle):
    scope = 'ai_daily'
