from django.contrib import admin
from django.urls import path
from django.conf.urls import url, include
from rest_framework import routers
from core import views
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="BAKE API",
      default_version='v1',
      description="TODO: description",
      # terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="minh.ta@aalto.fi"),
      # license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

router = routers.DefaultRouter()

urlpatterns = [
    # path('admin/', admin.site.urls),
    path(r"chains/", views.ChainListView.as_view()),
    path(r"chains/<pk>/", views.ChainDetailView.as_view()),

    path(r"projects/", views.ProjectListView.as_view()),
    path(r"projects/<pk>/", views.ProjectDetailView.as_view()),

    path(r"pipelines/", views.PipelineListView.as_view()),
    path(r"pipelines/<pk>/", views.PipelineDetailView.as_view()),

    # path(r"activity_categories/", views.ActivityCategoryListView.as_view()),
    # path(r"activity_categories/<pk>/", views.ActivityCategoryDetailView.as_view()),

    path(r"activities/", views.ActivityListView.as_view()),
    path(r"activities/<pk>/", views.ActivityDetailView.as_view()),

    path(r"tools/", views.ToolListView.as_view()),
    path(r"tools/<pk>/", views.ToolDetailView.as_view()),

    path(r"languages/", views.LanguageListView.as_view()),
    path(r"languages/<pk>/", views.LanguageDetailView.as_view()),

    path(r"communication_channels/", views.CommunicationChannelListView.as_view()),
    path(r"communication_channels/<pk>/", views.CommunicationChannelDetailView.as_view()),

   #  path(r"engineering_methods/", views.EngineeringMethodListView.as_view()),
   #  path(r"engineering_methods/<pk>/", views.EngineeringMethodDetailView.as_view()),

    path(r"testing_paths/", views.TestingPathListView.as_view()),
    path(r"testing_paths/<pk>/", views.TestingPathDetailView.as_view()),

    path(r"testing_scopes/", views.TestingScopeListView.as_view()),
    path(r"testing_scopes/<pk>/", views.TestingScopeDetailView.as_view()),

    path(r"communities/", views.CommunityListView.as_view()),
    path(r"communities/<pk>/", views.CommunityDetailView.as_view()),

    path(r"communication_channels/", views.CommunicationChannelListView.as_view()),
    path(r"communication_channels/<pk>/", views.CommunicationChannelDetailView.as_view()),

    path(r"limitations/", views.LimitationListView.as_view()),
    path(r"limitations/<pk>/", views.LimitationDetailView.as_view()),

    path(r"practices/", views.PracticeListView.as_view()),
    path(r"practices/<pk>/", views.PracticeDetailView.as_view()),

    url(r'^docs/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # url(r'^docs/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

urlpatterns += router.urls