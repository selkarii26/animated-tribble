import copy
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from src.app import app, activities


client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities():
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


def test_root_redirect():
    # Arrange / Act
    resp = client.get("/", follow_redirects=False)

    # Assert
    assert resp.status_code in (307, 308)
    assert resp.headers.get("location", "").endswith("/static/index.html")


def test_list_activities():
    # Arrange / Act
    resp = client.get("/activities")

    # Assert
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert len(data) > 0


def test_signup_success_and_duplicate():
    # Arrange
    activity_name = next(iter(activities))
    quoted = quote(activity_name, safe="")
    email = "tester@example.com"

    # Act: signup first time
    resp1 = client.post(f"/activities/{quoted}/signup", params={"email": email})

    # Assert
    assert resp1.status_code == 200
    assert email in activities[activity_name]["participants"]

    # Act: signup duplicate
    resp2 = client.post(f"/activities/{quoted}/signup", params={"email": email})

    # Assert duplicate produces 400
    assert resp2.status_code == 400


def test_signup_not_found():
    # Arrange
    activity_name = "Nonexistent Activity"
    quoted = quote(activity_name, safe="")
    email = "nobody@example.com"

    # Act
    resp = client.post(f"/activities/{quoted}/signup", params={"email": email})

    # Assert
    assert resp.status_code == 404


def test_remove_participant_success_and_not_found():
    # Arrange
    activity_name = next(iter(activities))
    quoted = quote(activity_name, safe="")
    email = "toremove@example.com"

    # Add participant first
    add = client.post(f"/activities/{quoted}/signup", params={"email": email})
    assert add.status_code == 200
    assert email in activities[activity_name]["participants"]

    # Act: remove participant
    rem = client.delete(f"/activities/{quoted}/participants", params={"email": email})

    # Assert removed
    assert rem.status_code == 200
    assert email not in activities[activity_name]["participants"]

    # Act: remove again (not found)
    rem2 = client.delete(f"/activities/{quoted}/participants", params={"email": email})

    # Assert not found
    assert rem2.status_code == 404
