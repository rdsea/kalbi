from os import path

from fabric.api import task, hosts, env, cd, run, prefix, prompt, shell_env


def ask_for_sshuser(func):
    def inner(*args, **kwargs):
        # default
        env.user = "deploy"
        env.key_filename = "~/.ssh/id_rsa"
        env.forward_agent = True

        if not path.exists(path.expanduser(env.key_filename)):
            env.key_filename = prompt(
                "Enter absolute path to private key:").strip()
        return func(*args, **kwargs)

    return inner


@task(alias="dd-stag")
@hosts("64.227.116.163")
@ask_for_sshuser
def deploy_stag():
    """
    Deploy latest changes to Staging server
    """
    with shell_env(NEO4J_BOLT_URL="bolt://neo4j:123123123@localhost:7687"):
        with cd("/home/deploy/bake/repo/bake"):
            with prefix(
                    "source /home/deploy/.envs/venv/bin/activate"
            ):
                # pull latest source
                run("git pull ductm master")
                # install new dependencies
                run("pip install -r requirements.txt")
                # run south migrate
                run("python manage.py migrate")
                # collect static
                run("python manage.py collectstatic --noinput")
                # clear old sessions
                run("python manage.py clearsessions")
                # restart server
                run("sudo systemctl restart bake.service")
                run("sudo systemctl restart bake.socket")
