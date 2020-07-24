from django.shortcuts import render
from django.http import Http404
from django.utils.decorators import method_decorator
from rest_framework import viewsets, generics, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from .models import (
    Chain, Tool, Project, Pipeline, ActivityCategory, Activity,
    Limitation, Practice, ReleasingChannel, App,
    Language, Community, CommunicationChannel,
    EngineeringMethod, TestingPath, TestingScope,
)
from core import serializers
from .utils import BaseDetailView, BaseListView, BaseDetailPostView, custom_view



# Create your views here.
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ChainSerializer
    )
)
class ChainListView(BaseListView):
    model = Chain

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ChainSerializer
    )
)
class ChainDetailView(BaseDetailView):
    model = Chain


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.AppSerializer
    )
)
class AppListView(BaseListView):
    model = App

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.AppSerializer
    )
)
class AppDetailView(BaseDetailView):
    model = App

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ProjectSerializer
    )
)
class ProjectListView(BaseListView):
    model = Project

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ProjectSerializer
    )
)
class ProjectDetailView(BaseDetailView):
    model = Project


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.PipelineSerializer
    )
)
class PipelineListView(BaseListView):
    model = Pipeline

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.PipelineSerializer
    )
)
class PipelineDetailView(BaseDetailView):
    model = Pipeline


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ActivityCategorySerializer
    )
)
class ActivityCategoryListView(BaseListView):
    model = ActivityCategory

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ActivityCategorySerializer
    )
)
class ActivityCategoryDetailView(BaseDetailView):
    model = ActivityCategory


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ActivitySerializer
    )
)
class ActivityListView(BaseListView):
    model = Activity

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ActivitySerializer
    )
)
class ActivityDetailView(BaseDetailView):
    model = Activity


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ToolSerializer
    )
)
class ToolListView(BaseListView):
    model = Tool

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ToolSerializer
    )
)
class ToolDetailView(BaseDetailView):
    model = Tool

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ToolSerializer
    )
)
class ToolWorkWithView(
    custom_view(detail=True, method='post')
):
    model = Tool

    def post(self, request, pk):
        obj = self.get_object(pk)

        tool = self.model.nodes.get(name=request.data.get('name'))
        if not tool: # create if the tool is new
            tool = self.model()
            tool.update_attributes(request.data)
            tool.save()

        obj.works.connect(tool)
        obj.refresh()
        return Response(obj.serialize, status=status.HTTP_200_OK)
    

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ToolSerializer
    )
)
class ToolConflictWithView(
    custom_view(detail=True, method='post')
):
    model = Tool

    def post(self, request, pk):
        obj = self.get_object(pk)

        tool = self.model.nodes.get(name=request.data.get('name'))
        if not tool: # create if the tool is new
            tool = self.model()
            tool.update_attributes(request.data)
            tool.save()

        obj.conflicts.connect(tool)
        obj.refresh()
        return Response(obj.serialize, status=status.HTTP_200_OK)


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.LanguageSerializer
    )
)
class LanguageListView(BaseListView):
    model = Language

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.LanguageSerializer
    )
)
class LanguageDetailView(BaseDetailView):
    model = Language


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.CommunicationChannelSerializer
    )
)
class CommunicationChannelListView(BaseListView):
    model = CommunicationChannel

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.CommunicationChannelSerializer
    )
)
class CommunicationChannelDetailView(BaseDetailView):
    model = CommunicationChannel


# @method_decorator(
#     name='post',
#     decorator=swagger_auto_schema(
#         request_body=BaseSerializer
#     )
# )
# class EngineeringMethodListView(BaseListView):
#     model = EngineeringMethod

# @method_decorator(
#     name='put',
#     decorator=swagger_auto_schema(
#         request_body=BaseSerializer
#     )
# )
# class EngineeringMethodDetailView(BaseDetailView):
#     model = EngineeringMethod


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.TestingPathSerializer
    )
)
class TestingPathListView(BaseListView):
    model = TestingPath

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.TestingPathSerializer
    )
)
class TestingPathDetailView(BaseDetailView):
    model = TestingPath

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.TestingScopeSerializer
    )
)
class TestingScopeListView(BaseListView):
    model = TestingScope

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.TestingScopeSerializer
    )
)
class TestingScopeDetailView(BaseDetailView):
    model = TestingScope


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.CommunitySerializer
    )
)
class CommunityListView(BaseListView):
    model = Community

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.CommunitySerializer
    )
)
class CommunityDetailView(BaseDetailView):
    model = Community


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.ReleasingChannelSerializer
    )
)
class ReleasingChannelListView(BaseListView):
    model = ReleasingChannel

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.ReleasingChannelSerializer
    )
)
class ReleasingChannelDetailView(BaseDetailView):
    model = ReleasingChannel


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.LimitationSerializer
    )
)
class LimitationListView(BaseListView):
    model = Limitation

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.LimitationSerializer
    )
)
class LimitationDetailView(BaseDetailView):
    model = Limitation


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=serializers.PracticeSerializer
    )
)
class PracticeListView(BaseListView):
    model = Practice

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=serializers.PracticeSerializer
    )
)
class PracticeDetailView(BaseDetailView):
    model = Practice