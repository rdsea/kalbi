from datetime import datetime

from django.db import models
from neomodel import (
    StructuredNode, StringProperty, DateProperty, DateTimeProperty,
    StructuredRel, BooleanProperty, UniqueIdProperty,
    RelationshipTo, RelationshipFrom,
    One, OneOrMore, ZeroOrMore,
)
from abc import ABCMeta
from neomodel import db

class NodeUtils:
    __metaclass__ = ABCMeta

    def serialize_relationships(self, nodes):
        serialized_nodes = []
        for node in nodes:
            # serialize node
            serialized_node = node.serialize

            # UNCOMMENT to get relationship type
            # results, colums = self.cypher('''
            #     START start_node=node({self}), end_node=node({end_node})
            #     MATCH (start_node)-[rel]-(end_node)
            #     RETURN type(rel) as node_relationship
            #     ''',
            #     {'end_node': node.id}
            # )
            # serialized_node['node_relationship'] = results[0][0]

            serialized_nodes.append(serialized_node)

        return serialized_nodes

# Create your models here.
class Chain(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    consensus = StringProperty()
    tools = RelationshipTo('Tool', 'RELATE')
    releasing_channels = RelationshipTo('ReleasingChannel', 'RELATE')

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
            "consensus": self.consensus,
        }

    @property
    def serialize_connections(self):
        return {
            "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']
        self.consensus = data['consensus']

class Language(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    tool = RelationshipFrom('Tool', 'BELONG', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            # "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']


class CommunicationChannel(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            # "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']


class EngineeringMethod(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    tools = RelationshipTo('Tool', 'HAS')
    activity = RelationshipFrom('Tool', 'BELONG', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']

class TestingPath(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    type = StringProperty()
    # tools = RelationshipTo('Tool', 'HAS')
    testing_scope = RelationshipFrom('Tool', 'BELONG', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            # "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']


class TestingScope(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    activity = RelationshipFrom('Activity', 'BELONG', cardinality=One)
    testing_paths = RelationshipTo('TestingPath', 'HAS')

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            # "tool": self.serialize_relationships(self.tool.all())
        }

    def update_attributes(self, data):
        self.name = data['name']


class ToolConflictRel(StructuredRel):
    since = DateTimeProperty(
        default=lambda: datetime.utcnow()
    )
    note = StringProperty()
    # solved = BooleanProperty(default_value=False)

class ToolWorkRel(StructuredRel):
    since = DateTimeProperty(
        default=lambda: datetime.utcnow()
    )
    note = StringProperty()
    # solved = BooleanProperty(default_value=False)

class Community(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    tools = RelationshipTo('Tool', 'HAS')

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "tools": self.serialize_relationships(self.tools.all())
        }

    def update_attributes(self, data):
        self.name = data['name']

class Tool(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    description = StringProperty()
    git = StringProperty()
    type = StringProperty()
    version = StringProperty()
    languages = RelationshipTo('Language', 'HAS')
    conflicts = RelationshipTo(
        'Tool', 'CONFLICT', model=ToolConflictRel
    )
    works = RelationshipTo(
        'Tool', 'WORK_WITH', model=ToolWorkRel
    )
    chains = RelationshipFrom('Chain', 'RELATE')

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
            "git": self.git,
            "version": self.version,
            "type": self.type,
        }

    @property
    def serialize_connections(self):
        return {
            "conflicts": self.serialize_relationships(self.conflicts.all()),
            "works": self.serialize_relationships(self.works.all()),
        }

    def update_attributes(self, data):
        fields = ["name", "git", "version", "type"]
        for field in fields:
            setattr(self, field, data[field])


class ActivityCategory(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        pass

    def update_attributes(self, data):
        self.name = data['name']


class Pipeline(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    project = RelationshipFrom('Project', 'BELONG', cardinality=One)
    activities = RelationshipFrom('Activity', 'HAS', cardinality=OneOrMore)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "project": self.serialize_relationships(self.project),
            "activities": self.serialize_relationships(self.activities.all()),
        }

    def update_attributes(self, data):
        self.name = data['name']


class App(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    scale = StringProperty()
    domain = StringProperty()
    projects = RelationshipTo('Project', 'HAS')

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "projects": self.serialize_relationships(self.projects)
        }

    def update_attributes(self, data):
        fields = ["name", "scale", "domain"]
        for field in fields:
            setattr(self, field, data[field])

class Project(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    pipeline = RelationshipTo('Pipeline', 'HAS', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "pipeline": self.serialize_relationships(self.pipeline)
        }

    def update_attributes(self, data):
        self.name = data['name']


class Activity(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    activity_category = RelationshipFrom('ActivityCategory', 'BELONG')
    pipeline = RelationshipFrom('Project', 'BELONG', cardinality=One)
    tools = RelationshipTo('Tool', 'USE', cardinality=ZeroOrMore)
    limitations = RelationshipFrom('Limitation', 'HAS', cardinality=OneOrMore)
    communication_channels = RelationshipTo('CommunicationChannel', 'USE', cardinality=ZeroOrMore)
    testing_scope = RelationshipTo('TestingScope', 'USE')
    engineering_method = RelationshipTo('EngineeringMethod', 'USE')


    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "tools": self.serialize_relationships(self.tools.all()),
            "limitations": self.serialize_relationships(self.limitations.all()),
            "activity_category": self.serialize_relationships(self.activity_category),
        }

    def update_attributes(self, data):
        self.name = data['name']


class Limitation(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    # activity = RelationshipFrom('Activity', 'BELONG', cardinality=One)
    practice = RelationshipTo('Practice', 'Has', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "activity": self.serialize_relationships(self.activity),
        }

    def update_attributes(self, data):
        self.name = data['name']


class Practice(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    limitation = RelationshipFrom('Limitation', 'BELONG', cardinality=One)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "limitation": self.serialize_relationships(self.limitation),
        }

    def update_attributes(self, data):
        self.name = data['name']


class ReleasingChannel(StructuredNode, NodeUtils):
    uuid = UniqueIdProperty()
    name = StringProperty(unique_index=True)
    # tools = RelationshipFrom('Tool', 'HAS', cardinality=OneOrMore)
    chains = RelationshipFrom('Chain', 'RELATE', cardinality=OneOrMore)

    @property
    def serialize(self):
        return {
            "uuid": self.uuid,
            "name": self.name,
        }

    @property
    def serialize_connections(self):
        return {
            "tools": self.serialize_relationships(self.tools.all()),
            "chains": self.serialize_relationships(self.chains.all()),
        }

    def update_attributes(self, data):
        self.name = data['name']