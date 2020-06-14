from django.shortcuts import render
from django.http import Http404
from django.utils.decorators import method_decorator
from rest_framework import viewsets, generics, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from drf_yasg.utils import swagger_auto_schema

from .models import (
    Chain, Tool, Project, Pipeline, ActivityCategory, Activity,
    Limitation, Practice, ReleasingChannel,
    Language, Community, CommunicationChannel,
    EngineeringMethod, TestingPath, TestingScope,
)
from .serializers import (
    ChainSerializer, BaseSerializer,
)
from .utils import BaseDetailView, BaseListView



# Create your views here.
@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=ChainSerializer
    )
)
class ChainListView(BaseListView):
    model = Chain

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=ChainSerializer
    )
)
class ChainDetailView(BaseDetailView):
    model = Chain



@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ProjectListView(BaseListView):
    model = Project

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ProjectDetailView(BaseDetailView):
    model = Project


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class PipelineListView(BaseListView):
    model = Pipeline

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class PipelineDetailView(BaseDetailView):
    model = Pipeline


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ActivityCategoryListView(BaseListView):
    model = ActivityCategory

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ActivityCategoryDetailView(BaseDetailView):
    model = ActivityCategory


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ActivityListView(BaseListView):
    model = Activity

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ActivityDetailView(BaseDetailView):
    model = Activity


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ToolListView(BaseListView):
    model = Tool

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ToolDetailView(BaseDetailView):
    model = Tool


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class LanguageListView(BaseListView):
    model = Language

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class LanguageDetailView(BaseDetailView):
    model = Language


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class CommunicationChannelListView(BaseListView):
    model = CommunicationChannel

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class CommunicationChannelDetailView(BaseDetailView):
    model = CommunicationChannel


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class EngineeringMethodListView(BaseListView):
    model = EngineeringMethod

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class EngineeringMethodDetailView(BaseDetailView):
    model = EngineeringMethod


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class TestingPathListView(BaseListView):
    model = TestingPath

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class TestingPathDetailView(BaseDetailView):
    model = TestingPath

@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class TestingScopeListView(BaseListView):
    model = TestingScope

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class TestingScopeDetailView(BaseDetailView):
    model = TestingScope


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class CommunityListView(BaseListView):
    model = Community

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class CommunityDetailView(BaseDetailView):
    model = Community


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ReleasingChannelListView(BaseListView):
    model = ReleasingChannel

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class ReleasingChannelDetailView(BaseDetailView):
    model = ReleasingChannel


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class LimitationListView(BaseListView):
    model = Limitation

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class LimitationDetailView(BaseDetailView):
    model = Limitation


@method_decorator(
    name='post',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class PracticeListView(BaseListView):
    model = Practice

@method_decorator(
    name='put',
    decorator=swagger_auto_schema(
        request_body=BaseSerializer
    )
)
class PracticeDetailView(BaseDetailView):
    model = Practice