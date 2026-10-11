def test_root_get(client):
    r = client.get("/")
    assert r.status_code == 200 and r.json() == {"message": "Engine Eye API is running!"}


def test_root_head(client):
    assert client.head("/").status_code == 200
