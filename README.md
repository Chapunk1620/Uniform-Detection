For cloning you can use:

git clone https://github.com/7078-cj/Uniform-Detection.git

For backend Setup:
(type this in the terminal)

1. virtualenv env (python and vitualenv package should be installed)
2. env\scrpts\activate
3. pip install -r requirements.txt
4.in the backend folder crea a file name .env
5.inside add
EMAIL_HOST_USER=(the email you will be using to send)
EMAIL_HOST_PASSWORD=(the password of your email or an app password created in the profile settings of google account)
(you can search how to create an app password)
**to run the local server of the backend**
6.cd backend
7.py manage.py runserver


for frontend setup:
1.cd frontend
2.npm install
**to run the local server of the frontend**
3.npm run dev
