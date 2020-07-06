from rest_framework import serializers
from drf_yasg import openapi
from .utils import BaseSerializer


class ChainSerializer(BaseSerializer):
    """
    Serializing Chain
    """
    properties = {
        "consensus": openapi.Schema(
            title="Consensus algorithm",
            type=openapi.TYPE_STRING,
        ),
    }

class LanguageSerializer(BaseSerializer):
    pass

class CommunicationChannelSerializer(BaseSerializer):
    pass


class TestingPathSerializer(BaseSerializer):
    properties = {
        "type": openapi.Schema(
            title="Type of testing path",
            type=openapi.TYPE_STRING,
        ),
    }

class TestingScopeSerializer(BaseSerializer):
    pass 

class AppSerializer(BaseSerializer):
    properties = {
        "scale": openapi.Schema(
            type=openapi.TYPE_STRING,
        ),
        "domain": openapi.Schema(
            type=openapi.TYPE_STRING,
        ),
    }

class ProjectSerializer(BaseSerializer):
    pass 

class PipelineSerializer(BaseSerializer):
    pass

class ActivityCategorySerializer(BaseSerializer):
    pass

class ActivitySerializer(BaseSerializer):
    pass

class ToolSerializer(BaseSerializer):
    properties = {
        "git": openapi.Schema(
            title="Link to git",
            type=openapi.TYPE_STRING,
        ),
        "version": openapi.Schema(
            type=openapi.TYPE_STRING,
        ),
        "type": openapi.Schema(
            title="Type of tool",
            type=openapi.TYPE_STRING,
        ),
    }

class CommunitySerializer(BaseSerializer):
    pass

class ReleasingChannelSerializer(BaseSerializer):
    pass

class LimitationSerializer(BaseSerializer):
    pass

class PracticeSerializer(BaseSerializer):
    pass