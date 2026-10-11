"""Tests for pagination helpers."""

from app.schemas.pagination import build_paginated, pagination_params


def test_pagination_params_clamps_values():
    page, page_size, offset = pagination_params(0, 500)
    assert page == 1
    assert page_size == 100
    assert offset == 0

    page, page_size, offset = pagination_params(3, 10)
    assert page == 3
    assert page_size == 10
    assert offset == 20


def test_build_paginated_pages():
    result = build_paginated(["a", "b"], total=25, page=1, page_size=10)
    assert result.pages == 3
    assert result.total == 25
    assert result.items == ["a", "b"]
