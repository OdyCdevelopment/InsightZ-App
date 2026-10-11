"""Tests for LLM extractor helpers."""

from ai.llm_extractor import trim_input_text


def test_trim_input_text_prefers_promo_lines():
    title = "Mega sale"
    content = "Plain cotton shirt\n50% off selected shirts\nWarehouse location Colombo"
    trimmed = trim_input_text(title, content)
    assert "Mega sale" in trimmed
    assert "50% off selected shirts" in trimmed
    assert "Warehouse location Colombo" not in trimmed


def test_trim_input_text_limits_size():
    content = "50% off " * 1000
    trimmed = trim_input_text("Sale", content)
    assert len(trimmed) <= 4000
