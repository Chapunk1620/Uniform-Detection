from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Student, StudentAttendance, StudentQR, StudentLogs, Course, UniformTrainingSample


class UserSerializer(serializers.ModelSerializer):
    class Meta:
       model = User
       fields = ('id', 'username', 'email', 'password')
       extra_kwargs = {'password': {'write_only': True}}
       
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            
        )
        return user
    
class CourseSerializer(serializers.ModelSerializer):
    class Meta:
       model= Course
       fields = "__all__"


    
class StudentQRSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentQR
        fields = "__all__"

class StudentAttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAttendance
        fields = ['uniform', 'status']
    
class StudentSerializer(serializers.ModelSerializer):
    studentQr = StudentQRSerializer(read_only=True)
    attendance_records = StudentAttendanceSerializer(many=True, read_only=True)
    fullName = serializers.CharField(read_only=True)
    course = CourseSerializer(read_only=True)
    
    
   
    class Meta:
        model = Student
        fields = '__all__'
        
class StudentLogsSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    class Meta:
        model = StudentLogs
        fields = '__all__'
        read_only_fields = ['student']


class UniformTrainingSampleSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = UniformTrainingSample
        fields = ['id', 'expected_label', 'notes', 'image', 'image_url', 'captured_by', 'created', 'updated']
        read_only_fields = ['captured_by']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        if request is None:
            return obj.image.url
        return request.build_absolute_uri(obj.image.url)
