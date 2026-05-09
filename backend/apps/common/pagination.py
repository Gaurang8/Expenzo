from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from math import ceil


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "limit"
    max_page_size = 100
    page_query_param = "page"

    def get_paginated_response(self, data):
        total_count = self.page.paginator.count
        limit = self.get_page_size(self.request)
        current_page = self.page.number

        return Response({
            "success": True,
            "message": "Data fetched successfully",
            "data": {
                "count": total_count,
                "page": current_page,
                "limit": limit,
                "total_pages": ceil(total_count / limit),
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "results": data,
            }
        })