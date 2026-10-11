"""Offer extractors — free rule-based implementation."""

from ai.rule_extractor import RuleBasedExtractor

# Shared entry point for non-Scrapy callers / tests.
extract_offer = RuleBasedExtractor().extract
