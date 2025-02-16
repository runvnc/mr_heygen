from setuptools import setup, find_packages

setup(
    name="mr_heygen",
    version="1.0.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    include_package_data=True,
    package_data={
        "mr_heygen": [
            "static/js/*.js",
            "static/*.js"
            "inject/*.jinja2",
            "override/*.jinja2",
            "static/node_modules/*/*"
        ],
    },
    install_requires=[
        "fastapi"
    ],
)
