import  json

from django.core.management.base import BaseCommand, CommandError
from core import models

MODEL_MAPPING = {
    "chains": models.Chain,
    "tools": models.Tool,
    "languages": models.Language,
    "testing_paths": models.TestingPath,
    "engineering_methods": models.EngineeringMethod,
    "pipelines": models.Pipeline,
    "communication_channels": models.CommunicationChannel,
    "releasing_channels": models.ReleasingChannel,
}
RELATIONSHIP_MODEL_MAPPING = {
    "tools": {
        "conflicts": models.Tool, # to draw conflict_with connection
        "chains": models.Chain, # to draw connection with the chain model
        "works": models.Tool, # to draw work_with connection
        "languages": models.Language, # to draw connection with language
    },
}

class Command(BaseCommand):
    """
    The command reads fixtures.json and populate the data in Neo4J.
    fixtures.json is gathered and prepared manually.

    The JSON file stores boostraping data and is listed/mapped as in MODEL_MAPPING
    Then for each type of model, the script below does:
    1. Fetch and populate the information
    2. Looks for relationship information in a dedicated JSON key `relationships`.
       The relationship are listed and defined as in RELATIONSHIP_MODEL_MAPPING

    """
    help = ''

    def add_arguments(self, parser):
        pass
        # parser.add_argument('chain', nargs='+', type=int)

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
        with open('fixtures.json') as f:
            fixtures = json.load(f)

        def _seed_entity(data_point):
            m = MODEL_MAPPING[data_point]
            for data in fixtures[data_point]:
                try:
                    obj = m.nodes.get(name=data['name'])
                except:
                    obj = m()

                obj.update_attributes(
                    {k:v for k,v in data.items() if k not in ["relationships"]}
                )
                obj.save()
                if "relationships" in data:
                    for k, v in data["relationships"].items():
                        to_connect_m = RELATIONSHIP_MODEL_MAPPING[data_point][k]
                        for name in v:
                            try:
                                to_connect_obj = to_connect_m.nodes.get(name=name)
                            except:
                                continue

                            try:
                                getattr(obj, k).connect(to_connect_obj)
                            except Exception as e:
                                print(e)
                                continue


        self._p("Seeding chain data")
        _seed_entity('chains')
        self._p("OK!", "SUCCESS")

        self._p("Seeding testing path data")
        _seed_entity('testing_paths')
        self._p("OK!", "SUCCESS")

        self._p("Seeding pipeline data")
        _seed_entity('pipelines')
        self._p("OK!", "SUCCESS")

        self._p("Seeding engineering method data")
        _seed_entity("engineering_methods")
        self._p("OK!", "SUCCESS")

        self._p("Seeding language data")
        _seed_entity("languages")
        self._p("OK!", "SUCCESS")

        self._p("Seeding tool data")
        _seed_entity("tools")
        self._p("OK!", "SUCCESS")

        self._p("DONE!", 'SUCCESS')

