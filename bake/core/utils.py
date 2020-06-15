from django.shortcuts import render
from django.http import Http404
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status, serializers


class BaseDetailView(
    APIView
):
    model = None

    def get_queryset(self):
        return self.model.nodes.all()

    def get_object(self, pk):
        try:
            return self.model.nodes.get(uuid=pk)
        except:
            raise Http404

    def get(self, request, pk):
        queryset = self.get_object(pk)
        return Response(queryset.serialize, status=status.HTTP_200_OK)

    def put(self, request, pk):
        obj = self.get_object(pk)
        obj.update_attributes(request.data)
        obj.save()
        obj.refresh()
        return Response(obj.serialize, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        obj.delete()
        return Response({}, status=status.HTTP_200_OK)

class BaseListView(
    APIView
):
    model = None

    def get_queryset(self):
        return self.model.nodes.all()

    def get(self, request):
        queryset = self.get_queryset()
        return Response(
            [n.serialize for n in queryset],
            status=status.HTTP_200_OK
        )

    def post(self, request):
        obj = self.model()
        obj.update_attributes(request.data)
        obj.save()
        return Response(obj.serialize, status=status.HTTP_200_OK)