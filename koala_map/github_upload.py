import base64
import requests


def upload_file(token, repo, path, commit_message):
    url = f"https://api.github.com/repos/{repo}/contents/{path}"
    with open(path, "rb") as f:
        content = base64.b64encode(f.read()).decode("utf-8")
    data = {
        "message": commit_message,
        "content": content
    }
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json"
    }
    r = requests.put(url, json=data, headers=headers)
    r.raise_for_status()
    return r.json()

if __name__ == "__main__":
    import os
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPO")
    path = "routes.json"
    if not token or not repo:
        print("Set GITHUB_TOKEN and GITHUB_REPO environment variables")
    else:
        resp = upload_file(token, repo, path, "Upload new route")
        print(resp)
