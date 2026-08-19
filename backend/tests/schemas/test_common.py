from app.schemas.common import Page


def test_page_does_not_report_more_items_on_exact_final_page() -> None:
    page = Page[int].of([1, 2], limit=2, offset=0)

    assert page.items == [1, 2]
    assert page.has_more is False


def test_page_truncates_probe_item_and_reports_more() -> None:
    page = Page[int].of([1, 2, 3], limit=2, offset=0)

    assert page.items == [1, 2]
    assert page.has_more is True
