import  json
import csv

from django.core.management.base import BaseCommand, CommandError
from core import models


class Command(BaseCommand):
    help = ''

    def add_arguments(self, parser):
        pass

    def _p(self, message, type='INFO'):
        if type == 'INFO':
            self.stdout.write(
                message
            )
        else:
            self.stdout.write(
                getattr(self.style, type)(message)
            )

    def handle(self, *args, **options):
        self._p("Importing data")

        def _get_or_create(m, name):
            try:
                obj = m.nodes.get(name=name)
            except:
                obj = m(name=name)

            return obj

        with open('data.csv') as f:
            data_csv = csv.DictReader(f.readlines())
            for row in data_csv:
                project_name = row['project name']
                scale = row['scale']
                domain = row['domain']
                role = row['development role']
                activity = row['activity']
                communication_channels = row['communication channel'].split(', ')
                testing_scope = row['testing scope']
                testing_paths = row['testing path'].split(', ')
                testing_tools = row['testing tools'].split(', ')
                engineering_method = row['requirements engineering method']
                releasing_channels = row['releasing channel'].split(', ')
                releasing_tools = row['releasing tool'].split(', ')
                monitoring_tools = row['monitoring tool'].split(', ')
                limitation = row['limitation']
                practice = row['practice']
                chains = row['chain'].split(", ")

                project = _get_or_create(models.Project, project_name)
                project.save()

                app = _get_or_create(models.App, project_name)
                app.scale = scale
                app.domain = domain
                app.save()
                app.projects.connect(project)

                pipeline = _get_or_create(models.Pipeline, "development")
                pipeline.save()

                for c in communication_channels:
                    obj = _get_or_create(models.CommunicationChannel, c)
                    obj.save()
                    
                activity_obj = _get_or_create(models.Activity, activity)
                activity_obj.save()
                pipeline.activities.connect(activity_obj)
                for c in communication_channels:
                    channel_obj = _get_or_create(models.CommunicationChannel, c)
                    activity_obj.communication_channels.connect(channel_obj)

                t_scope = _get_or_create(models.TestingScope, testing_scope)
                t_scope.save()
                activity_obj.testing_scope.connect(t_scope)

                for t in testing_paths:
                    t_path = _get_or_create(models.TestingPath, t)
                    t_path.save()
                    t_scope.testing_paths.connect(t_path)

                e = _get_or_create(models.EngineeringMethod, engineering_method)
                e.save()
                activity_obj.engineering_method.connect(e)

                for c in chains:
                    if c:
                        ch = _get_or_create(models.Chain, c)
                        ch.save()

                # testing_tools + releasing_tools + monitoring_tools
                tools = testing_tools + releasing_tools + monitoring_tools
                for t in tools:
                    t_obj = _get_or_create(models.Tool, t)
                    t_obj.save()
                    activity_obj.tools.connect(t_obj)
                    for c in chains:
                        if c:
                            ch = _get_or_create(models.Chain, c)
                            ch.tools.connect(t_obj)

                # releashing channel
                for rc in releasing_channels:
                    rc_obj = _get_or_create(models.ReleasingChannel, rc) 
                    rc_obj.save()
                    for c in chains:
                        if c:
                            ch = _get_or_create(models.Chain, c)
                            ch.releasing_channels.connect(rc_obj)


                # limitation
                if limitation:
                    l_obj = _get_or_create(models.Limitation, limitation)
                    l_obj.save()
                    activity_obj.limitations.connect(l_obj)

                # practice
                if practice:
                    pra_obj = _get_or_create(models.Practice, practice)
                    pra_obj.save()
                    l_obj.practice.connect(pra_obj)


        self._p("OK!", "SUCCESS")

        


