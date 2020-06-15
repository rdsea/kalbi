from rest_framework import serializers
from drf_yasg import openapi



class ChainSerializer(serializers.Serializer):
    """
    Serializing Chain
    """
    class Meta:
        swagger_schema_fields = {
            "properties": {
                "name": openapi.Schema(
                    title="Name of chain",
                    type=openapi.TYPE_STRING,
                ),
                "consensus": openapi.Schema(
                    title="Consensus algorithm",
                    type=openapi.TYPE_STRING,
                ),
            },
            "required": ["name", "consensus"],
        }


class BaseSerializer(serializers.Serializer):
    """
    Serializing Base
    """
    class Meta:
        swagger_schema_fields = {
            "properties": {
                "name": openapi.Schema(
                    title="Name of chain",
                    type=openapi.TYPE_STRING,
                ),
            },
            "required": ["name",],
        }

# TODO: filling all serializers
        
class ToolSerializer(serializers.Serializer):
    pass

class ActivityCategorySerializer(serializers.Serializer):
    pass

class ActivityCategorySerializer(serializers.Serializer):
    pass

class PipelineSerializer(serializers.Serializer):
    pass

class ProjectSerializer(serializers.Serializer):
    pass