import os

from importlib import import_module

from aim.sdk.configs import get_aim_repo_name
from aim.sdk.utils import clean_repo_path
from aim.web.configs import AIM_UI_MOUNTED_REPO_PATH


def get_module(name, required=True):
    try:
        return import_module(name)
    except Exception:
        if required:
            raise ValueError("No module named: '{}'".format(name))
        return None


def ls_dir(path):
    """
    List the files in directories
    """
    if not path or not os.path.exists:
        return []

    if os.path.isfile(path):
        return [path]

    ls = []

    for root, _, file_names in os.walk(path):
        for file_name in file_names:
            ls.append(os.path.join(root, file_name))

    return ls


def get_root_path():
    return clean_repo_path(os.getenv(AIM_UI_MOUNTED_REPO_PATH, os.getcwd()))


def get_db_url():
    if os.environ.get("AIM_USE_PG", False):
        pg_user = os.environ['AIM_PG_USER']
        pg_password = os.environ['AIM_PG_PASSWORD']
        pg_host = os.environ['AIM_PG_HOST']
        pg_port = os.environ['AIM_PG_PORT']
        pg_dbname = os.environ['AIM_PG_DBNAME_WEB']

        return f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_dbname}"
    else:        
        return 'sqlite:///{}/{}/aim_db'.format(get_root_path(), get_aim_repo_name())
    
