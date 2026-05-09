from rest_framework.views import APIView
from apps.common.responses import success_response


class HealthCheckView(APIView):
    permission_classes = []

    def get(self, request):
        return success_response(
            data={"status": "ok"},
            message="API working",
        )