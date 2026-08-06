"""
Generates a display_id like "1CH-101" or "BUG-101", retrying on a
unique-constraint collision instead of trusting a single COUNT() read —
two concurrent creates can otherwise compute the same next number and
collide. Shared by stories.py and issues.py.
"""
from typing import Callable, Optional


def create_with_display_id(
    supabase,
    table: str,
    prefix: str,
    build_row: Callable[[str], dict],
    max_attempts: int = 5,
) -> dict:
    """build_row(display_id) must return the full row dict to insert."""
    count_result = supabase.table(table).select("id", count="exact").execute()
    next_number = 100 + (count_result.count or 0) + 1

    last_error: Optional[Exception] = None
    for attempt in range(max_attempts):
        display_id = f"{prefix}-{next_number + attempt}"
        try:
            result = supabase.table(table).insert(build_row(display_id)).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            if "duplicate key" in str(e).lower() or "already exists" in str(e).lower():
                last_error = e
                continue
            raise

    raise last_error or RuntimeError(f"Failed to generate a unique display_id for {table}")
